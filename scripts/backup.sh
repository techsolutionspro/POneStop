#!/bin/bash
# Database backup script
# Run via cron: 0 2 * * * /path/to/backup.sh

set -e

BACKUP_DIR="${BACKUP_DIR:-/backups}"
DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/pharmacy_one_stop}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="pharmacy_one_stop_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[Backup] Starting database backup..."
pg_dump "$DB_URL" | gzip > "$BACKUP_DIR/$FILENAME"

SIZE=$(ls -lh "$BACKUP_DIR/$FILENAME" | awk '{print $5}')
echo "[Backup] Completed: $FILENAME ($SIZE)"

# Upload to S3 if configured
if [ -n "$AWS_S3_BUCKET" ]; then
  aws s3 cp "$BACKUP_DIR/$FILENAME" "s3://$AWS_S3_BUCKET/backups/$FILENAME"
  echo "[Backup] Uploaded to S3: s3://$AWS_S3_BUCKET/backups/$FILENAME"
fi

# Clean old backups
find "$BACKUP_DIR" -name "pharmacy_one_stop_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "[Backup] Cleaned backups older than $RETENTION_DAYS days"
