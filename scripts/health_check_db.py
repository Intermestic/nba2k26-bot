#!/usr/bin/env python3
"""
NBA 2K26 Discord Bot - Database-Logging Health Check Script

This version logs health check results to the database for dashboard visualization.
Run this via cron every 5-15 minutes to build historical data.
"""

import sys
import json
import time
import requests
import mysql.connector
from datetime import datetime
from typing import Dict, Any
import os

# Configuration
HEALTH_URL = "http://localhost:3001/health"
WEB_SERVER_URL = "http://localhost:3000"
TIMEOUT_SECONDS = 10

# Database configuration (from environment)
DB_URL = os.getenv("DATABASE_URL", "")

def parse_db_url(url: str) -> Dict[str, Any]:
    """Parse MySQL connection string"""
    # Format: mysql://user:password@host:port/database?ssl=...
    if not url.startswith("mysql://"):
        raise ValueError("Invalid DATABASE_URL format")
    
    url = url.replace("mysql://", "")
    auth, rest = url.split("@")
    user, password = auth.split(":")
    host_port, database_part = rest.split("/")
    
    # Remove SSL parameters if present
    if "?" in database_part:
        database = database_part.split("?")[0]
    else:
        database = database_part
    
    if ":" in host_port:
        host, port = host_port.split(":")
    else:
        host = host_port
        port = "3306"
    
    return {
        "user": user,
        "password": password,
        "host": host,
        "port": int(port),
        "database": database,
        "ssl_disabled": False  # TiDB requires SSL
    }

def check_health_endpoint() -> Dict[str, Any]:
    """Check the bot's health endpoint"""
    result = {
        "success": False,
        "status": "unknown",
        "uptime": 0,
        "errors": 0,
        "response_time_ms": 0,
        "message": ""
    }
    
    try:
        start_time = time.time()
        response = requests.get(HEALTH_URL, timeout=TIMEOUT_SECONDS)
        response_time = (time.time() - start_time) * 1000
        
        result["response_time_ms"] = round(response_time, 2)
        
        if response.status_code != 200:
            result["message"] = f"HTTP {response.status_code}"
            return result
        
        try:
            data = response.json()
        except json.JSONDecodeError:
            result["message"] = "Invalid JSON response"
            return result
        
        if "status" not in data:
            result["message"] = "Missing 'status' field in response"
            return result
        
        result["status"] = data.get("status", "unknown")
        result["uptime"] = data.get("uptime", 0)
        
        # Handle errors as either list or count
        errors = data.get("errors", [])
        if isinstance(errors, list):
            result["errors"] = len(errors)
        else:
            result["errors"] = errors
        
        if result["status"] in ["healthy", "degraded"]:
            result["success"] = True
            result["message"] = f"Bot is {result['status']}"
        else:
            result["message"] = f"Bot status: {result['status']}"
        
        return result
        
    except requests.exceptions.Timeout:
        result["message"] = f"Timeout after {TIMEOUT_SECONDS}s"
        return result
    except requests.exceptions.ConnectionError:
        result["message"] = "Connection refused - bot offline"
        return result
    except Exception as e:
        result["message"] = f"Error: {str(e)}"
        return result

def check_web_server() -> Dict[str, Any]:
    """Check if the web server is responding"""
    result = {
        "success": False,
        "response_time_ms": 0,
        "message": ""
    }
    
    try:
        start_time = time.time()
        response = requests.get(WEB_SERVER_URL, timeout=TIMEOUT_SECONDS)
        response_time = (time.time() - start_time) * 1000
        
        result["response_time_ms"] = round(response_time, 2)
        
        if response.status_code == 200:
            result["success"] = True
            result["message"] = "Web server responding"
        else:
            result["message"] = f"HTTP {response.status_code}"
        
        return result
        
    except Exception as e:
        result["message"] = f"Error: {str(e)}"
        return result

def log_to_database(health_result: Dict[str, Any], web_result: Dict[str, Any]) -> bool:
    """Log health check results to database"""
    try:
        if not DB_URL:
            print("ERROR: DATABASE_URL not set", file=sys.stderr)
            return False
        
        db_config = parse_db_url(DB_URL)
        
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # Prepare data
        status = health_result["status"] if health_result["success"] else "unhealthy"
        uptime = health_result["uptime"]
        errors = health_result["errors"]
        health_response_time = int(health_result["response_time_ms"])
        web_response_time = int(web_result["response_time_ms"]) if web_result["success"] else None
        web_server_up = 1 if web_result["success"] else 0
        message = health_result["message"]
        
        # Insert into database
        query = """
        INSERT INTO botHealthMetrics 
        (status, uptime, errors, healthResponseTime, webResponseTime, webServerUp, message)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        
        cursor.execute(query, (
            status,
            uptime,
            errors,
            health_response_time,
            web_response_time,
            web_server_up,
            message
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"ERROR: Failed to log to database: {e}", file=sys.stderr)
        return False

def main():
    """Main execution function"""
    # Check health endpoint
    health_result = check_health_endpoint()
    
    # Check web server
    web_result = check_web_server()
    
    # Log to database
    if log_to_database(health_result, web_result):
        print(f"✓ Logged: {health_result['status']} | Health: {health_result['response_time_ms']}ms | Web: {web_result['response_time_ms']}ms")
        sys.exit(0)
    else:
        print("✗ Failed to log to database")
        sys.exit(1)

if __name__ == "__main__":
    main()
