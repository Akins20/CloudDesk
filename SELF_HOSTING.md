# CloudDesk Self-Hosted Deployment Guide

Deploy CloudDesk in your own infrastructure with full control over your data. This guide covers everything from quick start to production-ready deployment.

## Table of Contents

- [Quick Start](#quick-start)
- [System Requirements](#system-requirements)
- [Configuration](#configuration)
- [Deployment Options](#deployment-options)
- [SSL/TLS Setup](#ssltls-setup)
- [Database Management](#database-management)
- [Monitoring & Logs](#monitoring--logs)
- [Backup & Recovery](#backup--recovery)
- [Upgrading](#upgrading)
- [Troubleshooting](#troubleshooting)
- [License Tiers](#license-tiers)

---

## Quick Start

Get CloudDesk running in 5 minutes:

```bash
# 1. Clone the repository
git clone https://github.com/Akins20/CloudDesk.git
cd CloudDesk

# 2. Copy and configure environment
cp backend/.env.selfhosted.example .env

# 3. Generate secrets (run each command and copy output to .env)
node -e "console.log('JWT_ACCESS_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"

# 4. Edit .env with your domain and passwords
nano .env

# 5. Start CloudDesk
docker compose -f docker-compose.selfhosted.yml up -d

# 6. Check status
docker compose -f docker-compose.selfhosted.yml ps
```

Access at: `https://your-domain.com`

---

## System Requirements

### Minimum Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Storage | 20 GB SSD | 50+ GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04/24.04 LTS |

### Software Requirements

- Docker Engine 24.0+
- Docker Compose 2.20+
- Domain name with DNS configured
- Ports 80, 443 open

### Network Requirements

CloudDesk requires the following network access:

**Inbound:**
- Port 80 (HTTP - redirects to HTTPS)
- Port 443 (HTTPS - API, WebSocket, Frontend)

**Outbound:**
- Your cloud instances (EC2, OCI) on port 22 (SSH)
- Let's Encrypt servers (for SSL certificates)

---

## Configuration

### Essential Configuration

Edit `.env` and set these required values:

```bash
# Your domain
DOMAIN=clouddesk.yourcompany.com

# Email for SSL certificates
ACME_EMAIL=admin@yourcompany.com

# Database passwords (generate secure random strings)
MONGO_ROOT_PASSWORD=<secure-random-password>
MONGO_PASSWORD=<different-secure-random-password>

# Security secrets (use the generation commands from Quick Start)
JWT_ACCESS_SECRET=<64-char-hex-string>
JWT_REFRESH_SECRET=<64-char-hex-string>
ENCRYPTION_KEY=<64-char-hex-string>
```

### All Configuration Options

See `backend/.env.selfhosted.example` for complete documentation of all options including:

- Session timeouts
- Rate limiting
- VNC/SSH parameters
- Logging levels
- License key

---

## Deployment Options

### Option 1: All-in-One (Recommended)

Single server deployment with all services:

```bash
docker compose -f docker-compose.selfhosted.yml up -d
```

Best for: Small teams, development, testing

### Option 2: Separate Frontend

Deploy frontend separately (e.g., Vercel, Netlify):

```bash
# Backend only
docker compose -f docker-compose.selfhosted.yml up -d redis mongodb backend session-controller

# Frontend (on Vercel/Netlify)
# Set NEXT_PUBLIC_API_URL to your backend URL
```

Best for: Teams wanting CDN-delivered frontend

### Option 3: External Database

Use managed MongoDB (Atlas) and Redis (ElastiCache):

```bash
# .env configuration
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/clouddesk
REDIS_URL=redis://:password@your-redis-host:6379

# Start without database containers
docker compose -f docker-compose.selfhosted.yml up -d traefik backend session-controller frontend
```

Best for: High availability, enterprise deployments

### Option 4: Kubernetes

Helm charts coming soon. For now, adapt the Docker Compose services to Kubernetes manifests.

---

## SSL/TLS Setup

### Automatic (Let's Encrypt)

The default configuration uses Traefik with automatic Let's Encrypt certificates:

```bash
# Ensure these are set in .env
DOMAIN=clouddesk.yourcompany.com
ACME_EMAIL=admin@yourcompany.com
```

Certificates auto-renew 30 days before expiration.

### Custom Certificates

To use your own certificates:

1. Place certificates in a volume:
```bash
mkdir -p ./certs
cp your-cert.crt ./certs/
cp your-key.key ./certs/
```

2. Mount in docker-compose.selfhosted.yml:
```yaml
traefik:
  volumes:
    - ./certs:/certs:ro
  command:
    # ... existing config ...
    - "--entrypoints.websecure.http.tls=true"
```

3. Configure Traefik labels on services:
```yaml
labels:
  - "traefik.http.routers.backend.tls=true"
```

### Behind Corporate Proxy

If deploying behind a corporate proxy/load balancer that handles SSL:

```yaml
# docker-compose.override.yml
services:
  traefik:
    command:
      - "--entrypoints.web.address=:80"
      # Remove HTTPS/certificate configuration
```

---

## Database Management

### MongoDB

**Connect to MongoDB:**
```bash
docker exec -it clouddesk-mongodb mongosh -u admin -p $MONGO_ROOT_PASSWORD
```

**Backup:**
```bash
docker exec clouddesk-mongodb mongodump --uri="mongodb://admin:$MONGO_ROOT_PASSWORD@localhost:27017" --out=/data/backup
docker cp clouddesk-mongodb:/data/backup ./backup-$(date +%Y%m%d)
```

**Restore:**
```bash
docker cp ./backup clouddesk-mongodb:/data/backup
docker exec clouddesk-mongodb mongorestore --uri="mongodb://admin:$MONGO_ROOT_PASSWORD@localhost:27017" /data/backup
```

### Redis

**Connect to Redis:**
```bash
docker exec -it clouddesk-redis redis-cli
```

**Monitor:**
```bash
docker exec clouddesk-redis redis-cli monitor
```

---

## Monitoring & Logs

### View Logs

```bash
# All services
docker compose -f docker-compose.selfhosted.yml logs -f

# Specific service
docker compose -f docker-compose.selfhosted.yml logs -f backend

# Last 100 lines
docker compose -f docker-compose.selfhosted.yml logs --tail 100 backend
```

### Health Checks

```bash
# API health
curl https://your-domain.com/api/health

# Container health
docker compose -f docker-compose.selfhosted.yml ps
```

### Metrics Endpoint

The admin dashboard at `/admin` provides:
- Server CPU/memory usage
- Active sessions
- User statistics
- Instance counts

---

## Backup & Recovery

### Automated Backups

Create a backup script (`/opt/clouddesk/backup.sh`):

```bash
#!/bin/bash
BACKUP_DIR="/opt/clouddesk/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup MongoDB
docker exec clouddesk-mongodb mongodump \
  --uri="mongodb://admin:${MONGO_ROOT_PASSWORD}@localhost:27017" \
  --archive=/data/backup.archive --gzip

docker cp clouddesk-mongodb:/data/backup.archive $BACKUP_DIR/mongodb_$DATE.archive.gz

# Backup Redis
docker exec clouddesk-redis redis-cli BGSAVE
docker cp clouddesk-redis:/data/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# Cleanup old backups (keep 7 days)
find $BACKUP_DIR -mtime +7 -delete

echo "Backup completed: $DATE"
```

Schedule with cron:
```bash
0 2 * * * /opt/clouddesk/backup.sh >> /var/log/clouddesk-backup.log 2>&1
```

### Disaster Recovery

1. Restore MongoDB:
```bash
docker cp mongodb_backup.archive.gz clouddesk-mongodb:/data/
docker exec clouddesk-mongodb mongorestore \
  --uri="mongodb://admin:${MONGO_ROOT_PASSWORD}@localhost:27017" \
  --archive=/data/mongodb_backup.archive.gz --gzip
```

2. Restore Redis:
```bash
docker stop clouddesk-redis
docker cp redis_backup.rdb clouddesk-redis:/data/dump.rdb
docker start clouddesk-redis
```

---

## Upgrading

### Standard Upgrade

```bash
cd /opt/clouddesk

# Pull latest
git pull origin main

# Pull new images
docker compose -f docker-compose.selfhosted.yml pull

# Restart with new images
docker compose -f docker-compose.selfhosted.yml up -d

# Check status
docker compose -f docker-compose.selfhosted.yml ps
```

### Database Migrations

Migrations run automatically on startup. For manual migration:

```bash
docker exec clouddesk-backend npm run migrate
```

### Rollback

```bash
# Stop services
docker compose -f docker-compose.selfhosted.yml down

# Checkout previous version
git checkout v1.2.3

# Start previous version
docker compose -f docker-compose.selfhosted.yml up -d
```

---

## Troubleshooting

### Common Issues

**Container won't start:**
```bash
# Check logs
docker compose -f docker-compose.selfhosted.yml logs backend

# Verify environment
docker compose -f docker-compose.selfhosted.yml config
```

**SSL certificate issues:**
```bash
# Check Traefik logs
docker compose -f docker-compose.selfhosted.yml logs traefik

# Verify domain DNS
dig +short your-domain.com
```

**Database connection failed:**
```bash
# Check MongoDB is running
docker exec clouddesk-mongodb mongosh --eval "db.adminCommand('ping')"

# Check network
docker network inspect clouddesk-network
```

**VNC sessions not working:**
```bash
# Check session controller
docker compose -f docker-compose.selfhosted.yml logs session-controller

# Verify Docker socket access
docker exec clouddesk-session-controller docker ps
```

### Reset Everything

⚠️ **Warning: This deletes all data!**

```bash
docker compose -f docker-compose.selfhosted.yml down -v
docker compose -f docker-compose.selfhosted.yml up -d
```

---

## License Tiers

### Community (Free)

- Up to 5 users
- Up to 10 instances
- 3 concurrent sessions
- Basic features

### Team ($99/month)

- Unlimited users
- Unlimited instances
- 20 concurrent sessions
- Audit logs
- Custom branding
- Email support

### Enterprise ($299/month)

- Everything in Team
- Unlimited concurrent sessions
- SSO integration
- Multi-tenant support
- Priority support
- SLA guarantee

### Activating a License

Add to your `.env`:

```bash
LICENSE_KEY=TEAM-XXXX-XXXX-XXXX-XXXX
```

Then restart:

```bash
docker compose -f docker-compose.selfhosted.yml restart backend
```

---

## Support

- **Documentation:** [docs.clouddesk.io](https://docs.clouddesk.io)
- **GitHub Issues:** [github.com/Akins20/CloudDesk/issues](https://github.com/Akins20/CloudDesk/issues)
- **Email:** support@clouddesk.io

For enterprise support inquiries: enterprise@clouddesk.io
