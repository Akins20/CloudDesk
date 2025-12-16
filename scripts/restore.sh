#!/bin/bash
# ============================================================================
# CloudDesk Restore Script
# Restores MongoDB and Redis data from backups
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}CloudDesk Restore Script${NC}"
echo "========================="
echo ""

# Check arguments
if [ -z "$1" ]; then
    echo "Usage: $0 <backup_date>"
    echo "Example: $0 20241215_120000"
    echo ""
    echo "Available backups:"
    ls -1 ./backups/mongodb_*.archive.gz 2>/dev/null | sed 's/.*mongodb_\(.*\)\.archive\.gz/\1/' || echo "No MongoDB backups found"
    exit 1
fi

BACKUP_DATE=$1
BACKUP_DIR="${BACKUP_DIR:-./backups}"

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

echo -e "${YELLOW}WARNING: This will overwrite existing data!${NC}"
read -p "Are you sure you want to restore from backup $BACKUP_DATE? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Restore MongoDB
MONGO_BACKUP="$BACKUP_DIR/mongodb_${BACKUP_DATE}.archive.gz"
if [ -f "$MONGO_BACKUP" ]; then
    echo -e "${YELLOW}Restoring MongoDB from $MONGO_BACKUP...${NC}"

    docker cp "$MONGO_BACKUP" clouddesk-mongodb:/tmp/restore.archive.gz

    docker exec clouddesk-mongodb mongorestore \
        --uri="mongodb://${MONGO_ROOT_USERNAME:-admin}:${MONGO_ROOT_PASSWORD}@localhost:27017" \
        --archive=/tmp/restore.archive.gz \
        --gzip \
        --drop

    docker exec clouddesk-mongodb rm /tmp/restore.archive.gz

    echo -e "${GREEN}✓ MongoDB restored successfully${NC}"
else
    echo -e "${RED}✗ MongoDB backup not found: $MONGO_BACKUP${NC}"
fi

# Restore Redis
REDIS_BACKUP="$BACKUP_DIR/redis_${BACKUP_DATE}.rdb"
if [ -f "$REDIS_BACKUP" ]; then
    echo -e "${YELLOW}Restoring Redis from $REDIS_BACKUP...${NC}"

    # Stop Redis, copy dump, restart
    docker stop clouddesk-redis
    docker cp "$REDIS_BACKUP" clouddesk-redis:/data/dump.rdb
    docker start clouddesk-redis

    echo -e "${GREEN}✓ Redis restored successfully${NC}"
else
    echo -e "${YELLOW}⚠ Redis backup not found: $REDIS_BACKUP (skipping)${NC}"
fi

echo ""
echo -e "${GREEN}Restore completed!${NC}"
echo ""
echo "Please restart the application to ensure all services pick up the restored data:"
echo "  docker compose -f docker-compose.selfhosted.yml restart"
