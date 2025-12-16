# Changelog

All notable changes to CloudDesk will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- License portal dashboard with usage analytics
- Session activity charts and recent activity tracking

### Changed
- Updated portal UI with glassmorphism design

---

## [1.0.0] - 2025-12-16

### Added

#### Core Features
- Browser-based VNC client using noVNC
- Multi-cloud support (AWS EC2, Oracle Cloud Infrastructure)
- Secure SSH tunneling for VNC connections
- AES-256 encrypted credential storage (zero-knowledge)
- Session management with heartbeat monitoring
- Multiple concurrent session support

#### Self-Hosted Deployment
- Docker Compose configuration for self-hosted deployment
- Kubernetes Helm chart with full configuration options
- Setup scripts for Linux/Mac (`setup.sh`) and Windows (`setup.ps1`)
- Environment variable templates (`.env.selfhosted.example`)
- NGINX configuration for SSL termination

#### License System
- Three-tier licensing: Community (free), Team ($99/mo), Enterprise ($299/mo)
- License key validation with offline fallback
- Usage limits enforcement (users, instances, sessions)
- License portal for key management and subscription billing

#### User Management
- User registration and authentication (JWT)
- Password hashing with bcrypt
- Refresh token rotation for session security
- Profile management

#### Instance Management
- Cloud instance CRUD operations
- SSH credential storage (encrypted)
- Connection testing
- Multi-provider support

#### Session Features
- Real-time VNC streaming via WebSocket
- Session history and statistics
- Activity tracking
- Automatic cleanup on disconnect

#### Infrastructure
- Session Controller for worker orchestration
- Session Worker containers (isolated per session)
- Redis pub/sub for real-time communication
- MongoDB for data persistence

#### CI/CD
- GitHub Actions workflow for Docker image builds
- Multi-registry publishing (Docker Hub + GHCR)
- Automated releases on version tags

### Security
- SSH tunnel encryption for all VNC traffic
- Client-side credential encryption before storage
- Rate limiting on API endpoints
- CORS configuration
- JWT token expiration and refresh

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 1.0.0 | 2025-12-16 | Initial self-hosted release |

---

## Upgrade Guide

### From Pre-release to 1.0.0

If you were running a pre-release version:

1. **Backup your data**
   ```bash
   docker compose exec mongodb mongodump --out /backup
   ```

2. **Pull the latest images**
   ```bash
   docker compose pull
   ```

3. **Update environment variables**
   - Compare your `.env` with `.env.selfhosted.example`
   - Add any new required variables

4. **Restart the stack**
   ```bash
   docker compose down
   docker compose up -d
   ```

---

## Links

- [GitHub Releases](https://github.com/Akins20/CloudDesk/releases)
- [Docker Hub](https://hub.docker.com/u/akins20)
- [Self-Hosting Guide](SELF_HOSTING.md)
- [Helm Chart](helm/clouddesk/README.md)
