# CloudDesk Backend Specifications

## Technology Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with sliding sessions
- **Encryption**: crypto (Node.js built-in) for AES-256
- **SSH Client**: ssh2
- **WebSocket**: ws
- **Additional Libraries**:
  - bcrypt (password hashing)
  - jsonwebtoken (JWT handling)
  - dotenv (environment configuration)
  - cors (CORS handling)
  - helmet (security headers)
  - express-rate-limit (rate limiting)
  - winston (logging)
  - joi (validation)

---

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts           # MongoDB connection configuration
│   │   ├── environment.ts        # Environment variables handler
│   │   ├── encryption.ts         # Encryption key management
│   │   └── constants.ts          # Application constants
│   ├── models/
│   │   ├── User.ts               # User model
│   │   ├── Instance.ts           # Instance model
│   │   ├── Session.ts            # Session model
│   │   └── AuditLog.ts           # Audit log model
│   ├── controllers/
│   │   ├── authController.ts     # Authentication endpoints
│   │   ├── instanceController.ts # Instance management endpoints
│   │   ├── sessionController.ts  # Session management endpoints
│   │   └── userController.ts     # User management endpoints
│   ├── services/
│   │   ├── authService.ts        # Authentication business logic
│   │   ├── sshService.ts         # SSH connection management
│   │   ├── vncService.ts         # VNC server management
│   │   ├── tunnelService.ts      # SSH tunnel management
│   │   ├── encryptionService.ts  # Credential encryption/decryption
│   │   ├── sessionService.ts     # Session lifecycle management
│   │   └── provisionService.ts   # Instance provisioning (VNC installation)
│   ├── middleware/
│   │   ├── auth.ts               # JWT authentication middleware
│   │   ├── validation.ts         # Request validation middleware
│   │   ├── errorHandler.ts       # Global error handler
│   │   └── rateLimiter.ts        # Rate limiting middleware
│   ├── routes/
│   │   ├── auth.routes.ts        # Authentication routes
│   │   ├── instance.routes.ts    # Instance routes
│   │   ├── session.routes.ts     # Session routes
│   │   └── user.routes.ts        # User routes
│   ├── websocket/
│   │   ├── vncProxy.ts           # VNC WebSocket proxy
│   │   └── connectionManager.ts  # WebSocket connection management
│   ├── utils/
│   │   ├── logger.ts             # Winston logger configuration
│   │   ├── validators.ts         # Validation schemas (Joi)
│   │   ├── errors.ts             # Custom error classes
│   │   └── helpers.ts            # Utility functions
│   ├── scripts/
│   │   └── install-vnc.sh        # VNC installation script for Ubuntu instances
│   ├── types/
│   │   ├── express.d.ts          # Express type extensions
│   │   └── models.d.ts           # Model type definitions
│   ├── app.ts                    # Express app configuration
│   └── server.ts                 # Server entry point
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── .env.example
├── .gitignore
├── tsconfig.json
├── package.json
└── README.md
```

---

## Database Schemas

### 1. User Schema

**Collection**: `users`

```typescript
interface IUser {
  _id: ObjectId;
  email: string;                    // Unique, lowercase, validated
  password: string;                 // Bcrypt hashed
  firstName: string;
  lastName: string;
  isActive: boolean;                // Account status
  role: 'user' | 'admin';           // Future expansion
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  refreshTokenVersion: number;      // For token invalidation
}

// Indexes:
// - email (unique)
// - createdAt
```

**Mongoose Schema Fields**:
- `email`: { type: String, required: true, unique: true, lowercase: true, trim: true }
- `password`: { type: String, required: true, minlength: 60 }
- `firstName`: { type: String, required: true, trim: true }
- `lastName`: { type: String, required: true, trim: true }
- `isActive`: { type: Boolean, default: true }
- `role`: { type: String, enum: ['user', 'admin'], default: 'user' }
- `lastLoginAt`: { type: Date }
- `refreshTokenVersion`: { type: Number, default: 0 }

**Methods**:
- `comparePassword(candidatePassword: string): Promise<boolean>`
- `incrementRefreshTokenVersion(): Promise<void>`

**Hooks**:
- `pre('save')`: Hash password if modified

---

### 2. Instance Schema

**Collection**: `instances`

```typescript
interface IInstance {
  _id: ObjectId;
  userId: ObjectId;                 // Reference to User
  name: string;                     // User-friendly name
  provider: 'ec2' | 'oci';          // Cloud provider
  host: string;                     // IP or hostname
  port: number;                     // SSH port (default 22)
  username: string;                 // SSH username
  authType: 'key' | 'password';     // Authentication method
  encryptedCredential: string;      // Encrypted SSH key or password
  tags: string[];                   // For categorization (dev, staging, prod)
  vncDisplayNumber?: number;        // Assigned VNC display (:1, :2, etc.)
  vncPort?: number;                 // VNC port (5901, 5902, etc.)
  desktopEnvironment?: 'xfce' | 'lxde'; // Installed DE
  isVncInstalled: boolean;          // Whether VNC is set up
  status: 'active' | 'inactive';    // Instance status
  createdAt: Date;
  updatedAt: Date;
  lastConnectedAt?: Date;
}

// Indexes:
// - userId
// - userId + name (compound, for quick lookup)
// - tags
// - status
```

**Mongoose Schema Fields**:
- `userId`: { type: Schema.Types.ObjectId, ref: 'User', required: true }
- `name`: { type: String, required: true, trim: true }
- `provider`: { type: String, enum: ['ec2', 'oci'], required: true }
- `host`: { type: String, required: true, trim: true }
- `port`: { type: Number, default: 22 }
- `username`: { type: String, required: true, trim: true }
- `authType`: { type: String, enum: ['key', 'password'], required: true }
- `encryptedCredential`: { type: String, required: true }
- `tags`: [{ type: String, trim: true }]
- `vncDisplayNumber`: { type: Number }
- `vncPort`: { type: Number }
- `desktopEnvironment`: { type: String, enum: ['xfce', 'lxde'] }
- `isVncInstalled`: { type: Boolean, default: false }
- `status`: { type: String, enum: ['active', 'inactive'], default: 'active' }
- `lastConnectedAt`: { type: Date }

**Methods**:
- `getDecryptedCredential(): Promise<string>`
- `markConnected(): Promise<void>`

**Virtuals**:
- `isConnected`: Computed from active sessions

---

### 3. Session Schema

**Collection**: `sessions`

```typescript
interface ISession {
  _id: ObjectId;
  userId: ObjectId;                 // Reference to User
  instanceId: ObjectId;             // Reference to Instance
  vncDisplayNumber: number;         // VNC display number
  vncPort: number;                  // VNC port
  sshTunnelLocalPort: number;       // Local tunnel port
  websocketPort: number;            // WebSocket server port for noVNC
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  errorMessage?: string;            // Error details if status is 'error'
  connectionStartedAt?: Date;
  connectionEndedAt?: Date;
  lastActivityAt: Date;             // For timeout tracking
  createdAt: Date;
  updatedAt: Date;
}

// Indexes:
// - userId
// - instanceId
// - status
// - lastActivityAt (for cleanup queries)
```

**Mongoose Schema Fields**:
- `userId`: { type: Schema.Types.ObjectId, ref: 'User', required: true }
- `instanceId`: { type: Schema.Types.ObjectId, ref: 'Instance', required: true }
- `vncDisplayNumber`: { type: Number, required: true }
- `vncPort`: { type: Number, required: true }
- `sshTunnelLocalPort`: { type: Number, required: true }
- `websocketPort`: { type: Number, required: true }
- `status`: { type: String, enum: ['connecting', 'connected', 'disconnected', 'error'], default: 'connecting' }
- `errorMessage`: { type: String }
- `connectionStartedAt`: { type: Date }
- `connectionEndedAt`: { type: Date }
- `lastActivityAt`: { type: Date, default: Date.now }

**Methods**:
- `updateActivity(): Promise<void>`
- `disconnect(): Promise<void>`

**Hooks**:
- `pre('save')`: Update lastActivityAt on modifications

---

### 4. AuditLog Schema

**Collection**: `auditlogs`

```typescript
interface IAuditLog {
  _id: ObjectId;
  userId: ObjectId;                 // Reference to User
  action: string;                   // e.g., 'LOGIN', 'INSTANCE_CONNECT', 'INSTANCE_CREATE'
  resource?: string;                // Resource affected (e.g., instance name)
  details?: object;                 // Additional context
  ipAddress?: string;               // User's IP
  userAgent?: string;               // Browser/client info
  status: 'success' | 'failure';
  createdAt: Date;
}

// Indexes:
// - userId
// - action
// - createdAt (for time-based queries)
```

**Mongoose Schema Fields**:
- `userId`: { type: Schema.Types.ObjectId, ref: 'User', required: true }
- `action`: { type: String, required: true }
- `resource`: { type: String }
- `details`: { type: Schema.Types.Mixed }
- `ipAddress`: { type: String }
- `userAgent`: { type: String }
- `status`: { type: String, enum: ['success', 'failure'], required: true }

---

## Services

### 1. authService

**Responsibilities**:
- User registration (create user, hash password)
- User login (validate credentials, generate JWT access + refresh tokens)
- Token refresh (sliding sessions)
- Token revocation (increment refreshTokenVersion)
- Password reset (future)

**Key Methods**:

```typescript
class AuthService {
  async register(data: RegisterDTO): Promise<{ user: IUser; accessToken: string; refreshToken: string }>;
  async login(email: string, password: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }>;
  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>;
  async logout(userId: string): Promise<void>;
  generateAccessToken(userId: string): string;
  generateRefreshToken(userId: string, version: number): string;
  verifyAccessToken(token: string): { userId: string };
  verifyRefreshToken(token: string): { userId: string; version: number };
}
```

**Token Configuration**:
- Access Token: 15 minutes expiry, signed with HS256
- Refresh Token: 7 days expiry, signed with HS256, includes version

**Sliding Session Logic**:
- On each authenticated request, if access token is close to expiry (e.g., < 5 min), client can request refresh
- Refresh endpoint validates refresh token, checks version against user's current version
- If valid, issues new access + refresh token pair
- Client replaces old tokens with new ones

---

### 2. sshService

**Responsibilities**:
- Establish SSH connections to instances
- Execute commands on instances
- Handle SSH authentication (key or password)
- Manage connection lifecycle

**Key Methods**:

```typescript
class SSHService {
  async createConnection(config: SSHConfig): Promise<Client>;
  async executeCommand(connection: Client, command: string): Promise<{ stdout: string; stderr: string }>;
  async uploadFile(connection: Client, localPath: string, remotePath: string): Promise<void>;
  async downloadFile(connection: Client, remotePath: string, localPath: string): Promise<void>;
  closeConnection(connection: Client): void;
}

interface SSHConfig {
  host: string;
  port: number;
  username: string;
  privateKey?: string;  // For key auth
  password?: string;    // For password auth
}
```

---

### 3. vncService

**Responsibilities**:
- Check if VNC server is running on instance
- Start/stop VNC server
- Assign VNC display numbers
- Manage VNC passwords

**Key Methods**:

```typescript
class VNCService {
  async isVNCInstalled(sshConnection: Client): Promise<boolean>;
  async getRunningVNCDisplays(sshConnection: Client): Promise<number[]>;
  async getAvailableDisplayNumber(sshConnection: Client): Promise<number>;
  async startVNCServer(sshConnection: Client, displayNumber: number, password: string): Promise<number>; // Returns VNC port
  async stopVNCServer(sshConnection: Client, displayNumber: number): Promise<void>;
  async setVNCPassword(sshConnection: Client, password: string): Promise<void>;
}
```

**Implementation Notes**:
- VNC display :1 maps to port 5901, :2 to 5902, etc.
- Use `vncserver` command (TigerVNC) or `x11vnc`
- VNC password stored using `vncpasswd` utility

---

### 4. tunnelService

**Responsibilities**:
- Create SSH tunnels for VNC connections
- Map remote VNC ports to local ports
- Track active tunnels
- Clean up tunnels on disconnect

**Key Methods**:

```typescript
class TunnelService {
  async createTunnel(sshConnection: Client, remotePort: number): Promise<number>; // Returns local port
  async closeTunnel(localPort: number): Promise<void>;
  getActiveTunnels(): Map<number, TunnelInfo>;
}

interface TunnelInfo {
  localPort: number;
  remotePort: number;
  instanceId: string;
  createdAt: Date;
}
```

**Implementation**:
- Use ssh2's `forwardOut` for port forwarding
- Track tunnels in memory (Map<localPort, TunnelInfo>)
- Automatically assign available local ports (e.g., range 6000-7000)

---

### 5. encryptionService

**Responsibilities**:
- Encrypt SSH credentials (keys/passwords) before storing in DB
- Decrypt credentials for use
- Manage encryption keys securely

**Key Methods**:

```typescript
class EncryptionService {
  encrypt(plaintext: string): string; // Returns base64 encrypted text
  decrypt(ciphertext: string): string; // Returns plaintext
}
```

**Implementation**:
- Use AES-256-CBC encryption
- Encryption key stored in environment variable (ENCRYPTION_KEY)
- Generate IV (Initialization Vector) for each encryption
- Store IV prepended to ciphertext: `iv:ciphertext`

---

### 6. sessionService

**Responsibilities**:
- Create new sessions
- Track session activity
- Timeout inactive sessions
- Clean up stale sessions

**Key Methods**:

```typescript
class SessionService {
  async createSession(userId: string, instanceId: string, vncInfo: VNCInfo): Promise<ISession>;
  async getActiveSession(instanceId: string): Promise<ISession | null>;
  async updateSessionActivity(sessionId: string): Promise<void>;
  async disconnectSession(sessionId: string): Promise<void>;
  async cleanupInactiveSessions(): Promise<void>; // Cron job
}

interface VNCInfo {
  displayNumber: number;
  vncPort: number;
  sshTunnelLocalPort: number;
  websocketPort: number;
}
```

**Session Timeout**:
- Sessions inactive for > 30 minutes are marked for cleanup
- Cleanup job runs every 5 minutes
- Disconnect action: close SSH tunnel, update session status, mark connectionEndedAt

---

### 7. provisionService

**Responsibilities**:
- Auto-install VNC server and desktop environment on instances
- Detect Ubuntu version
- Execute installation script
- Verify installation success

**Key Methods**:

```typescript
class ProvisionService {
  async provisionVNC(sshConnection: Client, desktopEnvironment: 'xfce' | 'lxde'): Promise<boolean>;
  async detectUbuntuVersion(sshConnection: Client): Promise<string>;
  async checkDiskSpace(sshConnection: Client): Promise<number>; // Returns GB available
}
```

**Installation Script** (`install-vnc.sh`):

```bash
#!/bin/bash
set -e

DE=$1  # xfce or lxde

# Update package lists
sudo apt-get update

# Install X server
sudo apt-get install -y xvfb

# Install VNC server
sudo apt-get install -y tigervnc-standalone-server tigervnc-common

# Install desktop environment
if [ "$DE" = "xfce" ]; then
  sudo apt-get install -y xfce4 xfce4-goodies
elif [ "$DE" = "lxde" ]; then
  sudo apt-get install -y lxde
fi

# Install terminal
if [ "$DE" = "xfce" ]; then
  sudo apt-get install -y xfce4-terminal
else
  sudo apt-get install -y lxterminal
fi

# Create VNC directory
mkdir -p ~/.vnc

echo "VNC installation completed successfully"
```

---

## Controllers & Routes

### 1. authController

**Routes**: `/api/auth/*`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /register | Register new user | No |
| POST | /login | Login user | No |
| POST | /refresh | Refresh access token | No (uses refresh token) |
| POST | /logout | Logout user | Yes |
| GET | /me | Get current user | Yes |

**Request/Response Examples**:

**POST /api/auth/register**
```json
Request:
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}

Response (201):
{
  "success": true,
  "data": {
    "user": {
      "id": "64a7f...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**POST /api/auth/login**
```json
Request:
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response (200):
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

---

### 2. instanceController

**Routes**: `/api/instances/*`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | / | List all user instances | Yes |
| GET | /:id | Get instance details | Yes |
| POST | / | Create new instance | Yes |
| PUT | /:id | Update instance | Yes |
| DELETE | /:id | Delete instance | Yes |
| POST | /:id/test-connection | Test SSH connection | Yes |

**Request/Response Examples**:

**POST /api/instances**
```json
Request:
{
  "name": "My Dev Server",
  "provider": "ec2",
  "host": "54.123.45.67",
  "port": 22,
  "username": "ubuntu",
  "authType": "key",
  "credential": "-----BEGIN RSA PRIVATE KEY-----\n...",
  "tags": ["development", "backend"]
}

Response (201):
{
  "success": true,
  "data": {
    "id": "64a7f...",
    "name": "My Dev Server",
    "provider": "ec2",
    "host": "54.123.45.67",
    "port": 22,
    "username": "ubuntu",
    "tags": ["development", "backend"],
    "status": "active",
    "isVncInstalled": false,
    "createdAt": "2024-12-13T10:00:00Z"
  }
}
```

**GET /api/instances**
```json
Response (200):
{
  "success": true,
  "data": [
    {
      "id": "64a7f...",
      "name": "My Dev Server",
      "provider": "ec2",
      "host": "54.123.45.67",
      "status": "active",
      "isConnected": false,
      "tags": ["development"],
      "lastConnectedAt": "2024-12-10T14:30:00Z"
    }
  ]
}
```

---

### 3. sessionController

**Routes**: `/api/sessions/*`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /connect | Connect to instance | Yes |
| POST | /disconnect/:sessionId | Disconnect session | Yes |
| GET | /active | Get active sessions | Yes |
| POST | /:sessionId/activity | Update session activity | Yes |

**Request/Response Examples**:

**POST /api/sessions/connect**
```json
Request:
{
  "instanceId": "64a7f...",
  "desktopEnvironment": "xfce"
}

Response (200):
{
  "success": true,
  "data": {
    "sessionId": "64a8...",
    "websocketUrl": "ws://localhost:6080",
    "vncDisplayNumber": 1,
    "status": "connecting",
    "messages": [
      "Connecting via SSH...",
      "Checking for VNC server...",
      "Installing desktop environment...",
      "Starting VNC server...",
      "Creating secure tunnel...",
      "Launching desktop viewer..."
    ]
  }
}
```

---

## Middleware

### 1. auth.ts

**Purpose**: Validate JWT access tokens

```typescript
interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  // Extract token from Authorization header (Bearer <token>)
  // Verify token using authService.verifyAccessToken()
  // Attach user info to req.user
  // Call next() or return 401 error
}
```

---

### 2. validation.ts

**Purpose**: Validate request bodies using Joi schemas

```typescript
function validate(schema: Joi.Schema) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Validate req.body against schema
    // If valid, call next()
    // If invalid, return 400 with validation errors
  };
}
```

**Example Schemas** (in utils/validators.ts):

```typescript
export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(2).required(),
  lastName: Joi.string().min(2).required(),
});

export const instanceSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  provider: Joi.string().valid('ec2', 'oci').required(),
  host: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).required(),
  port: Joi.number().min(1).max(65535).default(22),
  username: Joi.string().min(2).required(),
  authType: Joi.string().valid('key', 'password').required(),
  credential: Joi.string().required(),
  tags: Joi.array().items(Joi.string()),
});
```

---

### 3. errorHandler.ts

**Purpose**: Global error handling

```typescript
function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  // Log error
  // Determine status code and message
  // Return JSON error response
  // Format: { success: false, error: { message, code } }
}
```

**Custom Error Classes**:

```typescript
class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}
```

---

## WebSocket (VNC Proxy)

### vncProxy.ts

**Purpose**: Proxy VNC traffic between noVNC client and VNC server via SSH tunnel

**Implementation**:

```typescript
class VNCProxy {
  private wss: WebSocket.Server;

  constructor(port: number) {
    this.wss = new WebSocket.Server({ port });
    this.wss.on('connection', this.handleConnection.bind(this));
  }

  private handleConnection(ws: WebSocket, req: IncomingMessage) {
    // Extract session info from query params or headers
    // Validate session
    // Connect to VNC server via SSH tunnel (localhost:tunnelPort)
    // Pipe data between WebSocket and VNC TCP connection
    // Handle disconnections
  }
}
```

**Flow**:
1. noVNC client connects to WebSocket at `ws://localhost:{websocketPort}?sessionId=xxx`
2. Server validates sessionId
3. Server creates TCP connection to SSH tunnel's local port
4. Bidirectional data piping: WebSocket ↔ VNC TCP

---

## Configuration

### Environment Variables (.env)

```bash
# Server
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/clouddesk

# JWT
JWT_ACCESS_SECRET=<random-256-bit-key>
JWT_REFRESH_SECRET=<random-256-bit-key>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Encryption
ENCRYPTION_KEY=<random-256-bit-key>

# SSH Tunnels
TUNNEL_PORT_RANGE_START=6000
TUNNEL_PORT_RANGE_END=7000

# WebSocket
WEBSOCKET_PORT_RANGE_START=6080
WEBSOCKET_PORT_RANGE_END=6180

# Session
SESSION_TIMEOUT_MINUTES=30

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info
```

---

## Security Considerations

1. **Credential Encryption**: All SSH keys/passwords encrypted with AES-256 before storage
2. **JWT**: Use strong secrets, short access token expiry
3. **HTTPS**: Enforce in production
4. **Rate Limiting**: Prevent brute force attacks
5. **Input Validation**: Validate all inputs with Joi
6. **SQL Injection**: Use Mongoose (prevents NoSQL injection)
7. **SSH Tunnels**: Never expose VNC ports directly; always tunnel via SSH
8. **Audit Logging**: Log all sensitive actions
9. **Helmet**: Use helmet middleware for security headers
10. **CORS**: Restrict to frontend domain only

---

## API Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {} // Optional
  }
}
```

**Common Error Codes**:
- `VALIDATION_ERROR` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `CONFLICT` (409) - e.g., duplicate email
- `INTERNAL_SERVER_ERROR` (500)
- `SSH_CONNECTION_FAILED` (503)
- `VNC_INSTALLATION_FAILED` (503)

---

## Logging

**Winston Configuration**:

```typescript
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});
```

**Log Levels**:
- `error`: Errors and exceptions
- `warn`: Warning messages
- `info`: General information (requests, connections)
- `debug`: Debugging information
- `verbose`: Very detailed logs

---

## Testing Strategy

1. **Unit Tests**: Test individual services and utilities
2. **Integration Tests**: Test API endpoints with mock database
3. **End-to-End Tests**: Test complete workflows (register → login → create instance → connect)

**Tools**:
- Jest (testing framework)
- Supertest (HTTP assertions)
- mongodb-memory-server (in-memory MongoDB for testing)

---

## Deployment Considerations

1. **Environment**: Use PM2 or Docker for production
2. **Database**: MongoDB Atlas or self-hosted MongoDB cluster
3. **Secrets**: Use environment variables, never commit to repo
4. **Monitoring**: Use tools like New Relic, Datadog, or CloudWatch
5. **Backups**: Regular MongoDB backups
6. **Scaling**: Use load balancer for multiple backend instances
7. **WebSocket**: Ensure WebSocket support in load balancer/reverse proxy

---

## Future Enhancements

1. **OAuth**: Google, GitHub, Microsoft login
2. **Multi-tenancy**: Organizations/teams
3. **RBAC**: Fine-grained permissions
4. **Cloud API Integration**: Auto-discover EC2/OCI instances
5. **Session Recording**: Record VNC sessions for playback
6. **File Transfer**: Drag-and-drop file upload/download
7. **Notifications**: Email/Slack alerts for connection issues
8. **Metrics**: Dashboard showing connection stats, usage analytics
