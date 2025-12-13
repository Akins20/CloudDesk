# CloudDesk Frontend Specifications

## Technology Stack

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: Zustand
- **Styling**: TailwindCSS
- **HTTP Client**: Axios
- **VNC Client**: noVNC
- **UI Components**: Custom components with Headless UI
- **Icons**: Heroicons or Lucide React
- **Form Handling**: React Hook Form
- **Validation**: Zod
- **Animations**: Framer Motion (optional)
- **Date Handling**: date-fns

---

## Project Structure

```
frontend/
├── src/
│   ├── assets/
│   │   ├── images/
│   │   └── fonts/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── Toast.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── instances/
│   │   │   ├── InstanceList.tsx
│   │   │   ├── InstanceCard.tsx
│   │   │   ├── InstanceForm.tsx
│   │   │   ├── InstanceDetails.tsx
│   │   │   └── ConnectionStatus.tsx
│   │   ├── desktop/
│   │   │   ├── DesktopViewer.tsx
│   │   │   ├── VNCCanvas.tsx
│   │   │   ├── ToolbarControls.tsx
│   │   │   └── ConnectionProgress.tsx
│   │   └── sessions/
│   │       ├── ActiveSessions.tsx
│   │       └── SessionTabs.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Instances.tsx
│   │   ├── DesktopView.tsx
│   │   └── NotFound.tsx
│   ├── services/
│   │   ├── api.ts              # Axios instance with interceptors
│   │   ├── authService.ts      # Authentication API calls
│   │   ├── instanceService.ts  # Instance API calls
│   │   └── sessionService.ts   # Session API calls
│   ├── store/
│   │   ├── authStore.ts        # Authentication state
│   │   ├── instanceStore.ts    # Instance state
│   │   └── sessionStore.ts     # Session state
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useInstances.ts
│   │   ├── useSessions.ts
│   │   └── useWebSocket.ts
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── instance.types.ts
│   │   └── session.types.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   └── validators.ts
│   ├── styles/
│   │   └── globals.css
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── public/
│   └── favicon.ico
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Design System

### Color Palette (Monochrome with Glassy Effects)

```typescript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Main palette - blacks, whites, grays
        'clouddesk-black': '#000000',
        'clouddesk-dark': '#0a0a0a',
        'clouddesk-darker': '#1a1a1a',
        'clouddesk-gray-900': '#2d2d2d',
        'clouddesk-gray-800': '#3a3a3a',
        'clouddesk-gray-700': '#4a4a4a',
        'clouddesk-gray-600': '#5a5a5a',
        'clouddesk-gray-500': '#6b6b6b',
        'clouddesk-gray-400': '#9ca3af',
        'clouddesk-gray-300': '#d1d5db',
        'clouddesk-gray-200': '#e5e7eb',
        'clouddesk-gray-100': '#f3f4f6',
        'clouddesk-white': '#ffffff',
        
        // Accent for status indicators only
        'status-success': '#10b981',
        'status-error': '#ef4444',
        'status-warning': '#f59e0b',
        'status-info': '#3b82f6',
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
        'glass-gradient-dark': 'linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.2) 100%)',
      },
    },
  },
};
```

### Typography

```css
/* Fonts: System fonts for speed and reliability */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
}

/* Code/monospace */
code, pre {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
}
```

### Component Styling Patterns

**Glassy Card**:
```tsx
<div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-xl">
  {/* Content */}
</div>
```

**Dark Glassy Card**:
```tsx
<div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-2xl">
  {/* Content */}
</div>
```

**Button Primary**:
```tsx
<button className="bg-white text-black hover:bg-gray-100 px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg">
  Connect
</button>
```

**Button Secondary**:
```tsx
<button className="bg-gray-800 text-white hover:bg-gray-700 px-6 py-2 rounded-lg font-medium transition-all duration-200 border border-gray-600">
  Cancel
</button>
```

**Input Field**:
```tsx
<input className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all duration-200" />
```

---

## Pages

### 1. Login Page (`/login`)

**Layout**:
- Centered authentication card
- Glassy background with subtle gradient
- Login form with email/password
- Link to register page
- "Remember me" checkbox (optional)

**Features**:
- Form validation (Zod)
- Error display for invalid credentials
- Loading state during authentication
- Redirect to dashboard on success

**Visual**:
```
┌─────────────────────────────────────┐
│                                     │
│         CloudDesk                   │
│         Login to your account       │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Email                         │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Password                      │ │
│  └───────────────────────────────┘ │
│                                     │
│  [ ] Remember me                    │
│                                     │
│  [      Login      ]                │
│                                     │
│  Don't have an account? Register   │
│                                     │
└─────────────────────────────────────┘
```

---

### 2. Register Page (`/register`)

**Layout**:
- Similar to login page
- Registration form with firstName, lastName, email, password, confirmPassword
- Link back to login

**Features**:
- Form validation (password strength, email format, password match)
- Success message and redirect to login
- Error handling

---

### 3. Dashboard (`/dashboard`)

**Layout**:
- Header with user info and logout
- Main content area showing overview/statistics
- Quick actions (Add Instance, View Active Sessions)

**Features**:
- Welcome message with user's name
- Statistics cards:
  - Total instances
  - Active connections
  - Recent activity
- Quick access to create new instance

**Visual**:
```
┌─────────────────────────────────────────────────┐
│ CloudDesk              [User Menu] [Logout]     │
├─────────────────────────────────────────────────┤
│                                                 │
│  Welcome back, John                             │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │    5     │  │    2     │  │    12    │      │
│  │Instances │  │ Active   │  │Sessions  │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                 │
│  Quick Actions:                                 │
│  [+ Add Instance]  [View Sessions]              │
│                                                 │
│  Recent Activity                                │
│  • Connected to My Dev Server (2 hours ago)     │
│  • Added Production DB (1 day ago)              │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### 4. Instances Page (`/instances`)

**Layout**:
- Header with search/filter controls
- Grid or list of instance cards
- "Add Instance" button (prominent)

**Features**:
- Search instances by name
- Filter by tags, provider, status
- Instance cards showing:
  - Name
  - Provider badge (EC2/OCI)
  - Host/IP
  - Status (Active/Inactive)
  - Connection status (Connected/Disconnected)
  - Tags
  - Quick actions (Connect, Edit, Delete)
- Click on card to view details or connect
- Create/edit instance modal

**Visual**:
```
┌─────────────────────────────────────────────────────┐
│ Instances              [Search] [Filter] [+ Add]    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────┐  ┌─────────────────┐          │
│  │ My Dev Server   │  │ Staging DB      │          │
│  │ EC2             │  │ OCI             │          │
│  │ 54.123.45.67    │  │ 123.45.67.89    │          │
│  │ ● Disconnected  │  │ ● Connected     │          │
│  │ [dev] [backend] │  │ [staging]       │          │
│  │                 │  │                 │          │
│  │ [Connect] [⋮]   │  │ [Disconnect][⋮] │          │
│  └─────────────────┘  └─────────────────┘          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### 5. Desktop View (`/desktop/:sessionId`)

**Layout**:
- Full-screen noVNC viewer
- Minimal top toolbar with controls
- Status indicator

**Features**:
- noVNC canvas for desktop interaction
- Toolbar controls:
  - Fullscreen toggle
  - Scaling options (fit window, remote scaling, local scaling)
  - Clipboard (copy/paste)
  - Send Ctrl+Alt+Del
  - Connection quality settings
  - Disconnect button
- Connection progress overlay (during initial connection)
- Latency indicator
- Reconnect on disconnect

**Visual**:
```
┌─────────────────────────────────────────────────────┐
│ [←Back] My Dev Server | ● Connected | [⚙][□][✕]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│                                                     │
│           [noVNC Desktop Viewer Canvas]             │
│                                                     │
│                                                     │
│                                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Connection Progress Overlay**:
```
┌─────────────────────────────────────┐
│                                     │
│  Connecting to My Dev Server        │
│                                     │
│  ✓ Connecting via SSH...            │
│  ✓ Checking for VNC server...       │
│  ⏳ Installing desktop environment...│
│  ⌛ Starting VNC server...           │
│  ⌛ Creating secure tunnel...        │
│                                     │
│         [Cancel]                    │
│                                     │
└─────────────────────────────────────┘
```

---

### 6. Not Found Page (`/404`)

**Layout**:
- Centered content
- 404 message
- Link back to dashboard

---

## State Management (Zustand)

### authStore

```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  clearError: () => void;
}
```

### instanceStore

```typescript
interface InstanceState {
  instances: Instance[];
  selectedInstance: Instance | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchInstances: () => Promise<void>;
  fetchInstanceById: (id: string) => Promise<void>;
  createInstance: (data: CreateInstanceData) => Promise<void>;
  updateInstance: (id: string, data: UpdateInstanceData) => Promise<void>;
  deleteInstance: (id: string) => Promise<void>;
  testConnection: (id: string) => Promise<boolean>;
  clearError: () => void;
}
```

### sessionStore

```typescript
interface SessionState {
  sessions: Session[];
  activeSession: Session | null;
  isConnecting: boolean;
  connectionProgress: ConnectionStep[];
  error: string | null;
  
  // Actions
  connectToInstance: (instanceId: string, desktopEnv: 'xfce' | 'lxde') => Promise<void>;
  disconnectSession: (sessionId: string) => Promise<void>;
  fetchActiveSessions: () => Promise<void>;
  updateSessionActivity: (sessionId: string) => Promise<void>;
  clearError: () => void;
}

interface ConnectionStep {
  message: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
}
```

---

## API Integration

### Base API Configuration

```typescript
// src/services/api.ts
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach access token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401, refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        await useAuthStore.getState().refreshAccessToken();
        const newToken = useAuthStore.getState().accessToken;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

---

### Authentication Service

```typescript
// src/services/authService.ts
import api from './api';

export const authService = {
  async login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    return response.data.data;
  },
  
  async register(data: RegisterData) {
    const response = await api.post('/auth/register', data);
    return response.data.data;
  },
  
  async refreshToken(refreshToken: string) {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data.data;
  },
  
  async logout() {
    await api.post('/auth/logout');
  },
  
  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data.data;
  },
};
```

---

### Instance Service

```typescript
// src/services/instanceService.ts
import api from './api';

export const instanceService = {
  async getAll() {
    const response = await api.get('/instances');
    return response.data.data;
  },
  
  async getById(id: string) {
    const response = await api.get(`/instances/${id}`);
    return response.data.data;
  },
  
  async create(data: CreateInstanceData) {
    const response = await api.post('/instances', data);
    return response.data.data;
  },
  
  async update(id: string, data: UpdateInstanceData) {
    const response = await api.put(`/instances/${id}`, data);
    return response.data.data;
  },
  
  async delete(id: string) {
    await api.delete(`/instances/${id}`);
  },
  
  async testConnection(id: string) {
    const response = await api.post(`/instances/${id}/test-connection`);
    return response.data.data.success;
  },
};
```

---

### Session Service

```typescript
// src/services/sessionService.ts
import api from './api';

export const sessionService = {
  async connect(instanceId: string, desktopEnvironment: 'xfce' | 'lxde') {
    const response = await api.post('/sessions/connect', {
      instanceId,
      desktopEnvironment,
    });
    return response.data.data;
  },
  
  async disconnect(sessionId: string) {
    await api.post(`/sessions/disconnect/${sessionId}`);
  },
  
  async getActiveSessions() {
    const response = await api.get('/sessions/active');
    return response.data.data;
  },
  
  async updateActivity(sessionId: string) {
    await api.post(`/sessions/${sessionId}/activity`);
  },
};
```

---

## Key Components

### InstanceCard

```typescript
interface InstanceCardProps {
  instance: Instance;
  onConnect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function InstanceCard({ instance, onConnect, onEdit, onDelete }: InstanceCardProps) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
      {/* Instance details */}
      {/* Connection status badge */}
      {/* Action buttons */}
    </div>
  );
}
```

---

### DesktopViewer

```typescript
interface DesktopViewerProps {
  sessionId: string;
  websocketUrl: string;
  onDisconnect: () => void;
}

export function DesktopViewer({ sessionId, websocketUrl, onDisconnect }: DesktopViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rfb = useRef<RFB | null>(null);
  
  useEffect(() => {
    // Initialize noVNC RFB client
    // Connect to WebSocket
    // Handle connection events
    // Clean up on unmount
  }, [websocketUrl]);
  
  return (
    <div className="relative w-full h-full bg-black">
      {/* Toolbar */}
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
```

**noVNC Integration**:

```typescript
import RFB from '@novnc/novnc/core/rfb';

// In useEffect
const rfbClient = new RFB(canvasRef.current, websocketUrl, {
  credentials: { password: '' },
});

rfbClient.addEventListener('connect', () => {
  console.log('Connected to VNC server');
});

rfbClient.addEventListener('disconnect', () => {
  console.log('Disconnected from VNC server');
  onDisconnect();
});

rfbClient.scaleViewport = true; // Fit to window
rfbClient.resizeSession = true; // Remote scaling

rfb.current = rfbClient;

// Cleanup
return () => {
  rfbClient.disconnect();
};
```

---

### InstanceForm (Modal)

```typescript
interface InstanceFormProps {
  isOpen: boolean;
  onClose: () => void;
  instance?: Instance; // If editing
  onSubmit: (data: CreateInstanceData) => Promise<void>;
}

export function InstanceForm({ isOpen, onClose, instance, onSubmit }: InstanceFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateInstanceData>();
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Form fields */}
        {/* Credential upload (file input for SSH key or password input) */}
        {/* Submit/Cancel buttons */}
      </form>
    </Modal>
  );
}
```

---

## Routing

```typescript
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/instances" element={<Instances />} />
          <Route path="/desktop/:sessionId" element={<DesktopView />} />
        </Route>
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Environment Variables

```bash
# .env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:6080
```

---

## Responsive Design

**Breakpoints**:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Approach**:
- Mobile-first design
- Instance cards stack on mobile
- Desktop viewer scales appropriately
- Sidebar collapses to hamburger menu on mobile

---

## Accessibility

1. **Semantic HTML**: Use proper tags (button, nav, main, etc.)
2. **ARIA Labels**: Label all interactive elements
3. **Keyboard Navigation**: Ensure all features accessible via keyboard
4. **Focus States**: Clear focus indicators
5. **Alt Text**: For images and icons
6. **Color Contrast**: Meet WCAG AA standards (even with monochrome palette)

---

## Performance Optimizations

1. **Code Splitting**: Use React.lazy for route-based splitting
2. **Memoization**: Use React.memo, useMemo, useCallback where appropriate
3. **Debouncing**: Debounce search inputs
4. **Virtual Lists**: For large instance lists (react-window)
5. **Image Optimization**: Lazy load images
6. **Bundle Size**: Keep bundle < 500KB (gzipped)

---

## Testing

1. **Unit Tests**: Test utilities, hooks, components (Vitest + React Testing Library)
2. **Integration Tests**: Test user flows (Login → Create Instance → Connect)
3. **E2E Tests**: Full application testing (Playwright)

---

## Build & Deployment

**Build**:
```bash
npm run build
# Outputs to dist/
```

**Preview**:
```bash
npm run preview
```

**Deployment**:
- Static hosting: Vercel, Netlify, Cloudflare Pages
- Ensure environment variables configured
- Enable HTTPS

---

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions

---

## Key Features Summary

1. **Authentication**: Login/Register with JWT
2. **Instance Management**: CRUD operations, search, filter, tags
3. **Desktop Viewing**: noVNC integration, full-screen, scaling, clipboard
4. **Session Management**: Multiple concurrent sessions, tabs
5. **Real-time Updates**: WebSocket for connection status
6. **Error Handling**: Toast notifications, error boundaries
7. **Loading States**: Spinners, skeletons, progress indicators
8. **Responsive**: Works on desktop and tablet

---

## Future Enhancements

1. **Dark Mode Toggle**: User preference (currently default dark)
2. **Keyboard Shortcuts**: Quick actions (e.g., Cmd+K for search)
3. **Session Recording Playback**: View recorded sessions
4. **File Transfer UI**: Drag-and-drop upload/download
5. **Notifications**: Browser notifications for session events
6. **Analytics Dashboard**: Usage stats, charts
7. **Theme Customization**: User-defined accent colors
8. **Mobile App**: React Native version
