# CloudDesk

Remote desktop access to your cloud instances via VNC. Connect to EC2, OCI, and other cloud VMs directly from your browser.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-20%2B-green.svg)
![Docker](https://img.shields.io/badge/docker-24%2B-blue.svg)

## Features

- **Browser-based VNC** - Access your cloud instances without installing software
- **Multi-cloud support** - AWS EC2, Oracle Cloud Infrastructure (OCI)
- **Secure connections** - SSH tunneling with encrypted credentials
- **Session management** - Multiple concurrent sessions with activity tracking
- **Collaboration** - Share sessions with team members (coming soon)
- **Self-hosted option** - Deploy in your own infrastructure

## Quick Start

### Option 1: Hosted Service (SaaS)

Visit [clouddesk.io](https://clouddesk.io) to get started immediately.

### Option 2: Self-Hosted

Deploy CloudDesk in your own infrastructure for full data sovereignty.

```bash
# Clone the repository
git clone https://github.com/Akins20/CloudDesk.git
cd CloudDesk

# Run setup script (generates secrets and .env)
# Linux/Mac:
./scripts/setup.sh

# Windows (PowerShell):
.\scripts\setup.ps1

# Start CloudDesk
docker compose -f docker-compose.selfhosted.yml up -d

# Check status
docker compose -f docker-compose.selfhosted.yml ps
```

Access at `https://your-domain.com`

📖 **Full self-hosting guide:** [SELF_HOSTING.md](SELF_HOSTING.md)

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

Copy the example files and configure:

```bash
# Frontend
cp .env.example .env.local

# Backend
cp backend/.env.example backend/.env
```

## Deployment

### Frontend (Vercel)

```bash
vercel --prod
```

### Backend (Docker)

```bash
cd backend
docker compose -f docker-compose.prod.yml up -d
```

## License Tiers

| Feature | Community | Team | Enterprise |
|---------|-----------|------|------------|
| Users | 5 | Unlimited | Unlimited |
| Instances | 10 | Unlimited | Unlimited |
| Concurrent Sessions | 3 | 20 | Unlimited |
| Audit Logs | ❌ | ✅ | ✅ |
| Custom Branding | ❌ | ✅ | ✅ |
| SSO Integration | ❌ | ❌ | ✅ |
| Priority Support | ❌ | ❌ | ✅ |
| Price | Free | $99/mo | $299/mo |

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

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

- **Documentation:** [SELF_HOSTING.md](SELF_HOSTING.md)
- **Issues:** [GitHub Issues](https://github.com/Akins20/CloudDesk/issues)
- **Email:** support@clouddesk.io

## License

MIT License - see [LICENSE](LICENSE) for details.
