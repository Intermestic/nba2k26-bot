#!/bin/bash
# Setup cron job for automated bot health monitoring
# Run this script once to schedule periodic health checks

echo "Setting up automated bot health monitoring..."

# Get the project directory
PROJECT_DIR="/home/ubuntu/nba2k26-database"

# Create cron job entry (runs every 5 minutes)
CRON_JOB="*/5 * * * * cd $PROJECT_DIR && python3 scripts/health_check_db.py >> /home/ubuntu/health_check.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "health_check_db.py"; then
    echo "✓ Cron job already exists"
else
    # Add cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✓ Cron job added successfully"
fi

echo ""
echo "Health check will run every 5 minutes and log to:"
echo "  /home/ubuntu/health_check.log"
echo ""
echo "To view logs:"
echo "  tail -f /home/ubuntu/health_check.log"
echo ""
echo "To remove the cron job:"
echo "  crontab -e"
echo "  (then delete the line containing 'health_check_db.py')"
