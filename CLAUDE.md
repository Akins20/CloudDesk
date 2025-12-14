# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CloudDesk is a web application for managing remote desktop connections to cloud instances (EC2/OCI) via VNC. It consists of:
- **Frontend**: Next.js 16 with React 19, TypeScript, and Tailwind CSS 4
- **Backend**: Node.js/Express with MongoDB (planned, in `backend/` directory)

## Commands

### Development
```bash
npm run dev      # Start Next.js dev server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Testing
Use Playwright for frontend and E2E tests. Run tests sequentially for database consistency:
```bash
npx playwright test --workers=1
```

## Architecture

### Frontend (Current - Next.js App Router)
- Uses App Router (`app/` directory)
- Path alias: `@/*` maps to project root
- Styling: Tailwind CSS with monochrome + glassy design system
- Fonts: Geist Sans and Geist Mono via `next/font`

### Planned Frontend Structure (per FRONTEND_SPECIFICATIONS.md)
- **State Management**: Zustand (stores in `src/store/`)
- **API Client**: Axios with JWT interceptors (`src/services/api.ts`)
- **VNC Integration**: noVNC library for desktop viewing
- **Forms**: React Hook Form + Zod validation
- **Key Pages**: Login, Register, Dashboard, Instances, DesktopView

### Backend Structure (per BACKEND_SPECIFICATIONS.md)
- **Stack**: Express.js, MongoDB/Mongoose, JWT auth
- **Services**: sshService, vncService, tunnelService, encryptionService, sessionService
- **SSH**: ssh2 library for connections and tunneling
- **WebSocket**: VNC proxy for noVNC client communication
- **Security**: AES-256 encryption for credentials, Helmet, rate limiting

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

### SSH/VNC Flow
1. SSH connect to instance
2. Check/install VNC server and desktop environment (XFCE/LXDE)
3. Start VNC server on available display
4. Create SSH tunnel (local port -> VNC port)
5. WebSocket proxy connects noVNC client to tunnel
- Backend server credentials are in backend directory in a server credentials file