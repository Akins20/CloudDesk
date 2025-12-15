# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CloudDesk is a web application for managing remote desktop connections to cloud instances (EC2/OCI) via VNC. It consists of:
- **Frontend**: Next.js 16 with React 19, TypeScript, and Tailwind CSS 4 (Vercel-hosted)
- **Backend**: Node.js/Express with MongoDB, Redis, containerized with Docker

## Commands

### Frontend Development
```bash
npm run dev      # Start Next.js dev server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Backend Development
```bash
cd backend
npm run dev      # Start with hot reload (ts-node-dev)
npm run build    # Compile TypeScript
npm start        # Start production server
```

### Docker (Production)
```bash
cd backend
docker compose -f docker-compose.prod.yml up -d   # Start full stack
docker compose -f docker-compose.prod.yml down    # Stop stack
docker compose -f docker-compose.prod.yml logs    # View logs
```

### Testing
Use Playwright for frontend and E2E tests. Run tests sequentially for database consistency:
```bash
npx playwright test --workers=1
```

## Architecture

### Frontend (Next.js App Router)
- Uses App Router (`app/` directory)
- Path alias: `@/*` maps to project root
- State Management: Zustand (stores in `lib/stores/`)
- API Client: Axios with JWT interceptors (`lib/services/api.ts`)
- VNC Integration: noVNC library for desktop viewing
- Forms: React Hook Form + Zod validation
- Styling: Tailwind CSS with monochrome + glassy design system
- Key Pages: Login, Register, Dashboard, Instances, Sessions, Settings, DesktopView

### Backend (Containerized)
- **API Server**: Express.js (`backend/src/`)
- **Database**: MongoDB 7 (containerized)
- **Cache/PubSub**: Redis 7 (containerized)
- **Session Controller**: Manages VNC worker containers (`backend/session-controller/`)
- **Session Worker**: Isolated VNC proxy per session (`backend/session-worker/`)
- **Host NGINX**: SSL termination (port 443)

### Container Architecture
```
┌─────────────────────────────────────────────────────────┐
│  Host NGINX (SSL)  ←───────────────────────────────────┤
│        │                                                │
│        ↓                                                │
│  ┌─────────────────────────────────────────────────┐  │
│  │  docker-compose.prod.yml                         │  │
│  │  ┌──────────┐  ┌────────┐  ┌─────────────────┐ │  │
│  │  │  Redis   │  │ MongoDB│  │ Backend API     │ │  │
│  │  │  :6379   │  │ :27017 │  │ :3000           │ │  │
│  │  └──────────┘  └────────┘  └─────────────────┘ │  │
│  │  ┌──────────────────────────────────────────┐  │  │
│  │  │ Session Controller                        │  │  │
│  │  │ (Spawns worker containers via Docker API)│  │  │
│  │  └──────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────┘  │
│                         ↓                              │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Session Workers (Dynamic)                       │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │  │
│  │  │ Worker 1 │  │ Worker 2 │  │ Worker N │      │  │
│  │  │ :8080    │  │ :8081    │  │ :808X    │      │  │
│  │  └──────────┘  └──────────┘  └──────────┘      │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Services
- **sshService**: SSH2 connections
- **vncService**: VNC server management on remote instances
- **tunnelService**: SSH tunnel management
- **encryptionService**: Server-side AES-256 encryption
- **sessionService**: Session lifecycle management
- **sessionRegistry**: Redis-based session state and pub/sub

## Design System

Monochrome palette with glassy effects:
- Base colors: `clouddesk-black` (#000000) through `clouddesk-white` (#ffffff)
- Status colors only for indicators: success (#10b981), error (#ef4444), warning (#f59e0b), info (#3b82f6)
- Glass effects: `bg-white/5 backdrop-blur-md border border-white/10`

## Key Patterns

### API Response Format
```typescript
// Success
{ success: true, data: { ... } }

// Error
{ success: false, error: { message: string, code: string } }
```

### JWT Authentication
- Access Token: 15min expiry
- Refresh Token: 7 days, with version tracking for invalidation
- Sliding session via token refresh

### Credential Security
- Frontend encrypts SSH keys/passwords with user's account password (Web Crypto API)
- Backend stores encrypted credentials (zero-knowledge - cannot decrypt)
- User must enter password to view/edit/use credentials

### SSH/VNC Flow (Containerized)
1. User requests connection → API validates and publishes to Redis
2. Session Controller receives request → Spawns worker container
3. Worker establishes SSH → Starts VNC → Creates tunnel → WebSocket proxy
4. noVNC client connects to worker via WebSocket
5. Heartbeat monitoring for session health
6. Cleanup on disconnect or timeout

## Backend Server Deployment

### Server Credentials
- **SSH Key**: `backend/CloudDesk.pem`
- **IP Address**: 54.156.134.142
- **Domain**: cldesk.duckdns.org
- **Username**: ubuntu
- **Working Directory**: `~/clouddesk`
- **Credentials File**: `backend/Backend_Server_Credentials.txt`

### Deploy Backend Changes
After making backend changes, deploy to the server (runs in Docker):

```bash
# 1. Build locally first to verify no TypeScript errors
cd backend && npm run build

# 2. SCP the backend source code to the server
scp -i backend/CloudDesk.pem -r backend/src ubuntu@54.156.134.142:~/clouddesk/

# 3. SSH into the server and rebuild Docker container
ssh -i backend/CloudDesk.pem ubuntu@54.156.134.142 "cd ~/clouddesk && docker compose up -d --build backend"
```

### Quick Deployment Commands (from project root)
```bash
# Deploy and rebuild (one-liner)
scp -i backend/CloudDesk.pem -r backend/src ubuntu@54.156.134.142:~/clouddesk/ && ssh -i backend/CloudDesk.pem ubuntu@54.156.134.142 "cd ~/clouddesk && docker compose up -d --build backend"

# SSH into server
ssh -i backend/CloudDesk.pem ubuntu@54.156.134.142

# Check backend logs
ssh -i backend/CloudDesk.pem ubuntu@54.156.134.142 "docker logs clouddesk-backend --tail 50"

# Check all container status
ssh -i backend/CloudDesk.pem ubuntu@54.156.134.142 "cd ~/clouddesk && docker compose ps"
```

### Server URLs
- Production API: https://cldesk.duckdns.org (SSL via Certbot/Let's Encrypt)
- Health Check: https://cldesk.duckdns.org/api/health

## Key Files

### Frontend
- `lib/utils/crypto.ts` - Client-side encryption utilities
- `lib/stores/` - Zustand stores for state management
- `components/ui/InfoPanel.tsx` - Contextual help panels
- `components/instances/InstanceForm.tsx` - Instance creation with encryption

### Backend
- `backend/docker-compose.prod.yml` - Production container orchestration
- `backend/src/services/sessionService.ts` - Session lifecycle
- `backend/src/services/redis/sessionRegistry.ts` - Redis session state
- `backend/session-controller/` - Container orchestration
- `backend/session-worker/` - Per-session VNC proxy

### API Endpoints

#### Sessions
- `POST /api/sessions/connect` - Start VNC session
- `POST /api/sessions/disconnect/:id` - End session
- `GET /api/sessions/active` - Get active sessions
- `GET /api/sessions/history` - Session history with pagination
- `GET /api/sessions/stats` - Session statistics
- `POST /api/sessions/disconnect-all` - Disconnect all sessions

#### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `DELETE /api/users/account` - Delete account and all data (requires password + "DELETE" confirmation)

#### Instances
- `GET /api/instances` - List all instances
- `POST /api/instances` - Create instance
- `GET /api/instances/:id` - Get instance
- `PUT /api/instances/:id` - Update instance
- `DELETE /api/instances/:id` - Delete instance
- `POST /api/instances/:id/test-connection` - Test SSH connection

#### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh tokens
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password