#!/bin/bash
# Pharmacy One Stop — Production Health Check Script
# Run via cron: */5 * * * * /opt/pharmacy-one-stop/health-check.sh

set -euo pipefail

API_URL="http://localhost:4000/api/health"
FRONTEND_URL="http://localhost:3000"
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL:-}"
ALERT_EMAIL="${ALERT_EMAIL:-ops@pharmacyonestop.co.uk}"
LOG_FILE="/var/log/pharmacy-one-stop/health-check.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

check_api() {
    local response
    response=$(curl -sf -o /dev/null -w "%{http_code}" --max-time 10 "$API_URL" 2>/dev/null) || true
    if [ "$response" = "200" ]; then
        echo "[$TIMESTAMP] API: OK" >> "$LOG_FILE"
        return 0
    else
        echo "[$TIMESTAMP] API: FAILED (HTTP $response)" >> "$LOG_FILE"
        return 1
    fi
}

check_frontend() {
    local response
    response=$(curl -sf -o /dev/null -w "%{http_code}" --max-time 10 "$FRONTEND_URL" 2>/dev/null) || true
    if [ "$response" = "200" ]; then
        echo "[$TIMESTAMP] Frontend: OK" >> "$LOG_FILE"
        return 0
    else
        echo "[$TIMESTAMP] Frontend: FAILED (HTTP $response)" >> "$LOG_FILE"
        return 1
    fi
}

check_database() {
    if pg_isready -q -h localhost -p 5432 2>/dev/null; then
        echo "[$TIMESTAMP] Database: OK" >> "$LOG_FILE"
        return 0
    else
        echo "[$TIMESTAMP] Database: FAILED" >> "$LOG_FILE"
        return 1
    fi
}

check_disk() {
    local usage
    usage=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
    if [ "$usage" -gt 90 ]; then
        echo "[$TIMESTAMP] Disk: WARNING ($usage% used)" >> "$LOG_FILE"
        return 1
    fi
    echo "[$TIMESTAMP] Disk: OK ($usage%)" >> "$LOG_FILE"
    return 0
}

check_memory() {
    local available
    available=$(free -m | awk 'NR==2 {printf "%.0f", $7/$2*100}')
    if [ "$available" -lt 10 ]; then
        echo "[$TIMESTAMP] Memory: WARNING (${available}% available)" >> "$LOG_FILE"
        return 1
    fi
    echo "[$TIMESTAMP] Memory: OK (${available}% available)" >> "$LOG_FILE"
    return 0
}

send_alert() {
    local message="$1"

    # Slack alert
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -sf -X POST "$SLACK_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{\"text\": \":rotating_light: *P1S Health Alert*\n${message}\"}" \
            2>/dev/null || true
    fi

    # Email alert
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "[P1S Alert] Health Check Failed" "$ALERT_EMAIL" 2>/dev/null || true
    fi
}

# Run all checks
mkdir -p "$(dirname "$LOG_FILE")"
FAILURES=""

check_api || FAILURES="$FAILURES\n- API server down"
check_frontend || FAILURES="$FAILURES\n- Frontend server down"
check_database || FAILURES="$FAILURES\n- Database connection failed"
check_disk || FAILURES="$FAILURES\n- Disk space critical"
check_memory || FAILURES="$FAILURES\n- Memory low"

if [ -n "$FAILURES" ]; then
    send_alert "Health check failures at $TIMESTAMP:$FAILURES"
    echo "[$TIMESTAMP] ALERT SENT: $FAILURES" >> "$LOG_FILE"
    exit 1
fi

echo "[$TIMESTAMP] All checks passed" >> "$LOG_FILE"
