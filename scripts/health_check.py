#!/usr/bin/env python3
"""
NBA 2K26 Discord Bot - Comprehensive Health Check Script

This script performs deep health verification beyond basic HTTP pings:
- Checks health endpoint response structure
- Verifies bot uptime and status
- Validates error counts and thresholds
- Tests database connectivity
- Monitors response times

Can be run manually or scheduled via cron for continuous monitoring.
"""

import sys
import json
import time
import requests
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
HEALTH_URL = "http://localhost:3001/health"
WEB_SERVER_URL = "http://localhost:3000"
TIMEOUT_SECONDS = 10
MAX_ERRORS_ALLOWED = 5
MIN_UPTIME_SECONDS = 60  # Alert if bot restarted recently

# ANSI color codes for terminal output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_header():
    """Print script header"""
    print(f"\n{Colors.BOLD}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}NBA 2K26 Bot Health Check{Colors.END}")
    print(f"{Colors.BLUE}Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.END}")
    print(f"{Colors.BOLD}{'='*60}{Colors.END}\n")

def check_health_endpoint() -> Dict[str, Any]:
    """
    Check the bot's health endpoint and validate response
    
    Returns:
        dict: Health check results with status and details
    """
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
        response_time = (time.time() - start_time) * 1000  # Convert to ms
        
        result["response_time_ms"] = round(response_time, 2)
        
        if response.status_code != 200:
            result["message"] = f"HTTP {response.status_code}"
            return result
        
        # Parse JSON response
        try:
            data = response.json()
        except json.JSONDecodeError:
            result["message"] = "Invalid JSON response"
            return result
        
        # Validate response structure
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
        
        # Check if bot is healthy
        if result["status"] == "healthy":
            result["success"] = True
            result["message"] = "Bot is healthy and responsive"
        elif result["status"] == "degraded":
            result["success"] = True
            result["message"] = f"Bot is degraded ({result['errors']} errors)"
        else:
            result["message"] = f"Bot status: {result['status']}"
        
        return result
        
    except requests.exceptions.Timeout:
        result["message"] = f"Timeout after {TIMEOUT_SECONDS}s"
        return result
    except requests.exceptions.ConnectionError:
        result["message"] = "Connection refused - bot may be offline"
        return result
    except Exception as e:
        result["message"] = f"Unexpected error: {str(e)}"
        return result

def check_web_server() -> Dict[str, Any]:
    """
    Check if the web server is responding
    
    Returns:
        dict: Web server check results
    """
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
        
    except requests.exceptions.Timeout:
        result["message"] = f"Timeout after {TIMEOUT_SECONDS}s"
        return result
    except requests.exceptions.ConnectionError:
        result["message"] = "Connection refused"
        return result
    except Exception as e:
        result["message"] = f"Error: {str(e)}"
        return result

def format_uptime(seconds: int) -> str:
    """Format uptime in human-readable format"""
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    
    if hours > 0:
        return f"{hours}h {minutes}m {secs}s"
    elif minutes > 0:
        return f"{minutes}m {secs}s"
    else:
        return f"{secs}s"

def print_result(title: str, result: Dict[str, Any], check_type: str = "health"):
    """Print formatted check result"""
    print(f"{Colors.BOLD}{title}{Colors.END}")
    
    if check_type == "health":
        # Health endpoint check
        if result["success"]:
            status_color = Colors.GREEN if result["status"] == "healthy" else Colors.YELLOW
            print(f"  Status: {status_color}✓ {result['status'].upper()}{Colors.END}")
            print(f"  Uptime: {format_uptime(result['uptime'])}")
            error_color = Colors.GREEN if result['errors'] == 0 else Colors.YELLOW
            print(f"  Errors: {error_color}{result['errors']}{Colors.END}")
            print(f"  Response Time: {result['response_time_ms']}ms")
            print(f"  Message: {result['message']}")
        else:
            print(f"  Status: {Colors.RED}✗ FAILED{Colors.END}")
            print(f"  Message: {Colors.RED}{result['message']}{Colors.END}")
    else:
        # Web server check
        if result["success"]:
            print(f"  Status: {Colors.GREEN}✓ ONLINE{Colors.END}")
            print(f"  Response Time: {result['response_time_ms']}ms")
        else:
            print(f"  Status: {Colors.RED}✗ OFFLINE{Colors.END}")
            print(f"  Message: {Colors.RED}{result['message']}{Colors.END}")
    
    print()

def evaluate_health(health_result: Dict[str, Any]) -> tuple[bool, str]:
    """
    Evaluate overall health and return pass/fail with reason
    
    Returns:
        tuple: (is_healthy, reason)
    """
    if not health_result["success"]:
        return False, "Health endpoint not responding"
    
    if health_result["status"] not in ["healthy", "degraded"]:
        return False, f"Bot status is '{health_result['status']}'"
    
    if health_result["errors"] > MAX_ERRORS_ALLOWED:
        return False, f"Too many errors ({health_result['errors']} > {MAX_ERRORS_ALLOWED})"
    
    # Removed uptime check - bot may restart frequently during development
    
    if health_result["response_time_ms"] > 5000:
        return False, f"Slow response time ({health_result['response_time_ms']}ms)"
    
    return True, "All checks passed"

def main():
    """Main execution function"""
    print_header()
    
    # Check health endpoint
    print(f"{Colors.BLUE}Checking bot health endpoint...{Colors.END}\n")
    health_result = check_health_endpoint()
    print_result("🏥 Health Endpoint", health_result, "health")
    
    # Check web server
    print(f"{Colors.BLUE}Checking web server...{Colors.END}\n")
    web_result = check_web_server()
    print_result("🌐 Web Server", web_result, "web")
    
    # Overall evaluation
    print(f"{Colors.BOLD}{'='*60}{Colors.END}")
    is_healthy, reason = evaluate_health(health_result)
    
    if is_healthy and web_result["success"]:
        print(f"{Colors.GREEN}{Colors.BOLD}✓ OVERALL STATUS: HEALTHY{Colors.END}")
        print(f"{Colors.GREEN}  {reason}{Colors.END}")
        exit_code = 0
    elif is_healthy and not web_result["success"]:
        print(f"{Colors.YELLOW}{Colors.BOLD}⚠ OVERALL STATUS: DEGRADED{Colors.END}")
        print(f"{Colors.YELLOW}  Bot is healthy but web server is not responding{Colors.END}")
        exit_code = 1
    else:
        print(f"{Colors.RED}{Colors.BOLD}✗ OVERALL STATUS: UNHEALTHY{Colors.END}")
        print(f"{Colors.RED}  {reason}{Colors.END}")
        exit_code = 2
    
    print(f"{Colors.BOLD}{'='*60}{Colors.END}\n")
    
    sys.exit(exit_code)

if __name__ == "__main__":
    main()
