# CloudDesk

<p align="center">
  <img src="docs/images/clouddesk-logo.png" alt="CloudDesk Logo" width="120" />
</p>

<p align="center">
  <strong>Remote desktop access to your cloud instances via VNC</strong><br>
  Connect to EC2, OCI, and other cloud VMs directly from your browser.
</p>

<p align="center">
  <a href="https://github.com/Akins20/CloudDesk/releases/latest">
    <img src="https://img.shields.io/github/v/release/Akins20/CloudDesk?include_prereleases&style=flat-square" alt="Latest Release" />
  </a>
  <a href="https://github.com/Akins20/CloudDesk/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License" />
  </a>
  <a href="https://github.com/Akins20/CloudDesk/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/Akins20/CloudDesk/docker-publish.yml?style=flat-square" alt="Build Status" />
  </a>
  <a href="https://hub.docker.com/u/akins20">
    <img src="https://img.shields.io/docker/pulls/akins20/backend?style=flat-square&label=docker%20pulls" alt="Docker Pulls" />
  </a>
</p>

<p align="center">
  <a href="#installation">Installation</a> &bull;
  <a href="#features">Features</a> &bull;
  <a href="#documentation">Documentation</a> &bull;
  <a href="#releases">Releases</a> &bull;
  <a href="#contributing">Contributing</a>
</p>

---

## Releases

### Latest Release: v1.0.0

> **Self-Hosted Edition** - Deploy CloudDesk on your own infrastructure

| Asset | Description |
|-------|-------------|
| [docker-compose.selfhosted.yml](https://github.com/Akins20/CloudDesk/releases/download/v1.0.0/docker-compose.selfhosted.yml) | Docker Compose configuration |
| [.env.selfhosted.example](https://github.com/Akins20/CloudDesk/releases/download/v1.0.0/.env.selfhosted.example) | Environment variables template |
| [SELF_HOSTING.md](https://github.com/Akins20/CloudDesk/blob/self-hosted/SELF_HOSTING.md) | Deployment guide |

### Docker Images

```bash
# Pull the latest images
docker pull akins20/backend:latest
docker pull akins20/frontend:latest
docker pull akins20/session-controller:latest
docker pull akins20/session-worker:latest
```

Available on [Docker Hub](https://hub.docker.com/u/akins20) and [GitHub Container Registry](https://github.com/Akins20/CloudDesk/pkgs/container).

### Helm Chart (Kubernetes)

```bash
helm repo add clouddesk https://akins20.github.io/clouddesk-charts
helm install clouddesk clouddesk/clouddesk
```

See [helm/clouddesk](helm/clouddesk) for configuration options.

---

## Features

- **Browser-based VNC** - Access your cloud instances without installing software
- **Multi-cloud support** - AWS EC2, Oracle Cloud Infrastructure (OCI), GCP, Azure
- **Secure connections** - SSH tunneling with AES-256 encrypted credentials
- **Session management** - Multiple concurrent sessions with activity tracking
- **Self-hosted option** - Deploy in your own infrastructure with full data sovereignty
- **License tiers** - Free community edition with paid upgrades for teams

## Installation

### Option 1: Quick Start (Docker)

```bash
# Clone the repository
git clone https://github.com/Akins20/CloudDesk.git
cd CloudDesk

# Run setup script
./scripts/setup.sh      # Linux/Mac
.\scripts\setup.ps1     # Windows PowerShell

# Start CloudDesk
docker compose -f docker-compose.selfhosted.yml up -d
```

Access at `http://localhost:3000` or `https://your-domain.com`

### Option 2: Hosted Service (SaaS)

Visit [clouddesk.io](https://clouddesk.io) to get started immediately.

### Option 3: Kubernetes (Helm)

```bash
helm install clouddesk ./helm/clouddesk \
  --set license.key=YOUR_LICENSE_KEY \
  --set ingress.hosts[0].host=clouddesk.example.com
```

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend API   │────▶│  Cloud Instance │
│   (Next.js)     │     │   (Express)     │     │  (EC2/OCI)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       ▼
        │               ┌─────────────────┐
        │               │  Session        │
        │               │  Controller     │
        │               └─────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│   noVNC Client  │◀───▶│  VNC Workers    │
│   (WebSocket)   │     │  (Docker)       │
└─────────────────┘     └─────────────────┘
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [SELF_HOSTING.md](SELF_HOSTING.md) | Complete self-hosting deployment guide |
| [CHANGELOG.md](CHANGELOG.md) | Version history and release notes |
| [helm/clouddesk/README.md](helm/clouddesk/README.md) | Kubernetes Helm chart documentation |
| [API Documentation](#api-documentation) | REST API reference |

---

## Development

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- MongoDB 7+
- Redis 7+

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run dev
```

### Environment Variables

```bash
# Frontend
cp .env.example .env.local

# Backend
cp backend/.env.example backend/.env
```

---

## License Tiers

| Feature | Community | Team | Enterprise |
|---------|-----------|------|------------|
| Users | 5 | 25 | Unlimited |
| Instances | 10 | 50 | Unlimited |
| Concurrent Sessions | 3 | 10 | Unlimited |
| Session History | 7 days | 90 days | Unlimited |
| Audit Logs | - | ✓ | ✓ |
| SSO (SAML) | - | ✓ | ✓ |
| Priority Support | - | Email | 24/7 |
| SLA | - | 99.5% | 99.9% |
| **Price** | **Free** | **$99/mo** | **$299/mo** |

Get your license at [license.clouddesk.io](https://license.clouddesk.io)

---

## API Documentation

### Authentication

```bash
# Register
POST /api/auth/register
{ "email": "user@example.com", "password": "..." }

# Login
POST /api/auth/login
{ "email": "user@example.com", "password": "..." }
```

### Instances

```bash
# List instances
GET /api/instances

# Create instance
POST /api/instances
{ "name": "...", "host": "...", "port": 22, ... }
```

### Sessions

```bash
# Connect to instance
POST /api/sessions/connect
{ "instanceId": "...", "password": "..." }

# Disconnect
POST /api/sessions/disconnect/:sessionId
```

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm test`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Development Workflow

- **main** - Production-ready code (SaaS)
- **self-hosted** - Self-hosted releases
- **develop** - Active development

---

## Support

- **Documentation:** [SELF_HOSTING.md](SELF_HOSTING.md)
- **Issues:** [GitHub Issues](https://github.com/Akins20/CloudDesk/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Akins20/CloudDesk/discussions)
- **Email:** support@clouddesk.io

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  <sub>Built with ❤️ by the CloudDesk team</sub>
</p>
