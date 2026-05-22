#!/bin/bash
# Pharmacy One Stop — PostgreSQL Backup Script
# Run via cron: 0 2 * * * /opt/pharmacy-one-stop/backup-db.sh
# Keeps 30 days of daily backups + 12 weekly backups

set -euo pipefail

DB_NAME="${DB_NAME:-pharmacy_one_stop}"
DB_USER="${DB_USER:-pharmacy}"
BACKUP_DIR="/var/backups/pharmacy-one-stop"
S3_BUCKET="${S3_BUCKET:-}"
RETENTION_DAYS=30
RETENTION_WEEKS=12
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
DAY_OF_WEEK=$(date '+%u')
BACKUP_FILE="$BACKUP_DIR/daily/${DB_NAME}_${TIMESTAMP}.sql.gz"
LOG_FILE="/var/log/pharmacy-one-stop/backup.log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"; }

# Create directories
mkdir -p "$BACKUP_DIR/daily" "$BACKUP_DIR/weekly" "$(dirname "$LOG_FILE")"

log "Starting backup of $DB_NAME..."

# Create compressed backup
if pg_dump -U "$DB_USER" -h localhost "$DB_NAME" | gzip > "$BACKUP_FILE"; then
    SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
    log "Backup created: $BACKUP_FILE ($SIZE)"
else
    log "ERROR: Backup failed!"
    exit 1
fi

# Weekly backup on Sundays
if [ "$DAY_OF_WEEK" = "7" ]; then
    WEEKLY_FILE="$BACKUP_DIR/weekly/${DB_NAME}_week_${TIMESTAMP}.sql.gz"
    cp "$BACKUP_FILE" "$WEEKLY_FILE"
    log "Weekly backup created: $WEEKLY_FILE"
fi

# Upload to S3 if configured
if [ -n "$S3_BUCKET" ]; then
    if aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/backups/daily/$(basename "$BACKUP_FILE")" --quiet; then
        log "Uploaded to S3: s3://$S3_BUCKET/backups/daily/$(basename "$BACKUP_FILE")"
    else
        log "WARNING: S3 upload failed"
    fi

    if [ "$DAY_OF_WEEK" = "7" ]; then
        aws s3 cp "$WEEKLY_FILE" "s3://$S3_BUCKET/backups/weekly/$(basename "$WEEKLY_FILE")" --quiet || true
    fi
fi

# Clean up old daily backups
find "$BACKUP_DIR/daily" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
DELETED_DAILY=$(find "$BACKUP_DIR/daily" -name "*.sql.gz" -mtime +$RETENTION_DAYS 2>/dev/null | wc -l)
log "Cleaned up $DELETED_DAILY daily backups older than $RETENTION_DAYS days"

# Clean up old weekly backups (keep 12 weeks)
WEEKLY_CUTOFF=$((RETENTION_WEEKS * 7))
find "$BACKUP_DIR/weekly" -name "*.sql.gz" -mtime +$WEEKLY_CUTOFF -delete 2>/dev/null || true

log "Backup completed successfully"
