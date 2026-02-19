#!/bin/bash
# Backup script for F1 Dashboard

BACKUP_DIR="/opt/f1-dashboard/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

mkdir -p $BACKUP_DIR

# Backup PostgreSQL
echo "Backing up PostgreSQL..."
docker exec f1-postgres pg_dump -U postgres postgres | gzip > $BACKUP_DIR/postgres_$DATE.sql.gz

# Backup Redis
echo "Backing up Redis..."
docker exec f1-redis redis-cli BGSAVE
docker cp f1-redis:/data/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# Backup logs
echo "Backing up logs..."
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz -C /opt/f1-dashboard logs/

# Clean old backups
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete

echo "Backup complete: $BACKUP_DIR/*_$DATE.*"