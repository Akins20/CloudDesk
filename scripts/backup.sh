#!/bin/bash
# ============================================================================
# CloudDesk Backup Script
# Creates backups of MongoDB and Redis data
# ============================================================================

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
DATE=$(date +%Y%m%d_%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}CloudDesk Backup Script${NC}"
echo "========================"
echo "Date: $(date)"
echo "Backup directory: $BACKUP_DIR"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Load environment variables if .env exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# MongoDB Backup
echo -e "${YELLOW}Backing up MongoDB...${NC}"
if docker ps --format '{{.Names}}' | grep -q clouddesk-mongodb; then
    docker exec clouddesk-mongodb mongodump \
        --uri="mongodb://${MONGO_ROOT_USERNAME:-admin}:${MONGO_ROOT_PASSWORD}@localhost:27017" \
        --archive=/tmp/mongodb_backup.archive \
        --gzip \
        --db=clouddesk

    docker cp clouddesk-mongodb:/tmp/mongodb_backup.archive "$BACKUP_DIR/mongodb_${DATE}.archive.gz"
    docker exec clouddesk-mongodb rm /tmp/mongodb_backup.archive

    echo -e "${GREEN}✓ MongoDB backup complete: mongodb_${DATE}.archive.gz${NC}"
else
    echo -e "${RED}✗ MongoDB container not running${NC}"
fi

# Redis Backup
echo -e "${YELLOW}Backing up Redis...${NC}"
if docker ps --format '{{.Names}}' | grep -q clouddesk-redis; then
    docker exec clouddesk-redis redis-cli BGSAVE
    sleep 2  # Wait for save to complete
    docker cp clouddesk-redis:/data/dump.rdb "$BACKUP_DIR/redis_${DATE}.rdb"

    echo -e "${GREEN}✓ Redis backup complete: redis_${DATE}.rdb${NC}"
else
    echo -e "${RED}✗ Redis container not running${NC}"
fi

# Backup .env file (without secrets visible)
echo -e "${YELLOW}Backing up configuration...${NC}"
if [ -f .env ]; then
    cp .env "$BACKUP_DIR/env_${DATE}.backup"
    echo -e "${GREEN}✓ Configuration backup complete${NC}"
fi

# Cleanup old backups
echo -e "${YELLOW}Cleaning up backups older than ${RETENTION_DAYS} days...${NC}"
find "$BACKUP_DIR" -type f -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true
echo -e "${GREEN}✓ Cleanup complete${NC}"

# Summary
echo ""
echo "========================"
echo -e "${GREEN}Backup Summary${NC}"
echo "========================"
echo "Location: $BACKUP_DIR"
ls -lh "$BACKUP_DIR"/*_${DATE}* 2>/dev/null || echo "No new backup files"
echo ""
echo "Total backup size:"
du -sh "$BACKUP_DIR" 2>/dev/null || echo "Unable to calculate"
echo ""
echo -e "${GREEN}Backup completed successfully!${NC}"
