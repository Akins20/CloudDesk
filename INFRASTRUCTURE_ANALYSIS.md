# CloudDesk Backend Infrastructure Analysis & Scaling Plan

## Executive Summary

This document analyzes the current CloudDesk backend infrastructure (deployed at 18.209.65.32) and provides detailed recommendations for scaling to support 1000+ concurrent users with multiple active VNC sessions.

**Critical Finding**: The current single-server, single-process Node.js architecture can support approximately 50-100 concurrent VNC sessions before hitting critical bottlenecks. Scaling to 1000+ users requires significant architectural changes.

---

## 1. Current Server Specifications

### Deployment Information
- **Server IP**: 18.209.65.32
- **Platform**: Assumed AWS EC2 (based on IP range)
- **No PM2 Configuration Found**: Backend runs as single Node.js process
- **Node.js Version**: v22.20.0 (as detected in development environment)

### Current Configuration Analysis

#### Port Allocations
```javascript
// From backend/src/config/environment.ts and .env.example

SSH Tunnel Port Range: 6000-7000 (1000 available ports)
WebSocket Port Range: 6080-6180 (100 available ports) [NOT USED - WebSocket uses single port]
API Server Port: 3000
VNC Base Port: 5900 (remote server side)
```

#### Session Limits
```javascript
// From backend/src/config/constants.ts

MAX_SESSIONS_PER_USER: 5
SESSION_TIMEOUT_MINUTES: 30
CLEANUP_INTERVAL_MS: 300000 (5 minutes)
```

#### Rate Limiting
```javascript
// From backend/src/config/environment.ts

RATE_LIMIT_WINDOW_MS: 900000 (15 minutes)
RATE_LIMIT_MAX_REQUESTS: 100 (per 15 minutes)
```

---

## 2. Current Capacity Analysis

### 2.1 Concurrent WebSocket Connections

**Current Architecture**:
- Single WebSocket server on path `/vnc`
- One WebSocket connection per active VNC session
- No clustering or horizontal scaling
- Heartbeat interval: 60 seconds
- Max missed pongs: 3

**Node.js WebSocket Limitations**:
```
Single Node.js Process Capacity:
- Theoretical Maximum: 65,536 file descriptors (OS limit)
- Practical Maximum: 10,000-15,000 concurrent WebSocket connections
- Recommended Maximum: 5,000-8,000 for stable operation

With Memory Overhead:
- Each WebSocket connection: ~10KB baseline + data buffers
- Each active VNC session: ~50-100MB (TCP buffer + data transfer)
```

**Current Bottleneck**:
- **Estimated Capacity**: 100-200 concurrent VNC sessions per single process
- **Primary Constraint**: Memory and event loop blocking, not WebSocket connections

### 2.2 SSH Tunnel Connections

**Current Implementation**:
```typescript
// From backend/src/services/tunnelService.ts

- Port range: 6000-7000 (1000 available ports)
- One SSH tunnel per session
- Each tunnel creates a local TCP server
- SSH keepalive: 10 seconds
- SSH keepalive max count: 3
```

**SSH Connection Pool Analysis**:
```
Per SSH Connection Memory: ~2-5MB
Maximum Concurrent Tunnels: 1000 (port range limit)

Actual Constraints:
- SSH2 library uses one connection per tunnel
- No connection pooling currently implemented
- Memory usage: 1000 tunnels × 5MB = 5GB minimum
```

**Current Bottleneck**:
- **Estimated Capacity**: 1000 concurrent tunnels (hard port limit)
- **Memory Requirement**: 5-10GB RAM for tunnels alone

### 2.3 VNC Port Range

**Configuration**:
```typescript
// From backend/src/services/tunnelService.ts

Local tunnel ports: 6000-7000 (1000 ports)
Remote VNC ports: 5901-5910 (managed on remote instances)
```

**Analysis**:
- Current port range supports maximum 1000 concurrent sessions (theoretical)
- In practice: Limited by SSH connections and memory first

### 2.4 MongoDB Connection Limits

**Current Configuration**:
```javascript
// Default MongoDB driver settings (no custom pool found)

Default Connection Pool Size: 100 connections
Connection Timeout: 30 seconds
```

**Database Operations per Session**:
1. Session creation: 1 write + 1 read
2. Activity updates: 1 write per heartbeat
3. Session disconnection: 1 write
4. Instance queries: 1-2 reads per operation

**Estimated MongoDB Load**:
```
1000 concurrent sessions:
- 1000 initial writes (session creation)
- 1000 heartbeat updates per minute (continuous writes)
- ~16-17 writes/second sustained

MongoDB capacity: Well within limits for this load
```

**Current Assessment**: MongoDB is NOT a bottleneck

### 2.5 Node.js Event Loop Limitations

**Single-Thread Architecture**:
```
Node.js runs single-threaded for JavaScript execution
- Event loop handles all I/O operations
- CPU-bound operations block the event loop
- Each VNC proxy creates bidirectional data streaming

Current Architecture Issues:
1. All WebSocket messages processed in single thread
2. All SSH tunnel management in single thread
3. TCP socket data piping blocks event loop during high throughput
```

**Estimated Event Loop Capacity**:
```
Low latency requirement for VNC (< 50ms)
Average VNC data rate: 1-5 Mbps per session
Processing overhead per WebSocket message: ~0.1-0.5ms

Theoretical capacity: ~2000 messages/second per session
Practical capacity: 100-200 concurrent sessions before latency degrades
```

**Current Bottleneck**:
- **Estimated Capacity**: 100-200 concurrent sessions
- **Primary Issue**: Event loop saturation

---

## 3. System Bottlenecks Summary

### Critical Bottlenecks (Immediate Issues)

| Component | Current Limit | Primary Constraint |
|-----------|--------------|-------------------|
| **Node.js Event Loop** | 100-200 sessions | Single-threaded processing |
| **Memory Usage** | 200 sessions | ~20-40GB RAM needed (100-200MB per session) |
| **SSH Tunnel Ports** | 1000 sessions | Port range 6000-7000 |
| **File Descriptors** | 1024-65536 | OS ulimit settings |

### Secondary Bottlenecks

| Component | Current Limit | Notes |
|-----------|--------------|-------|
| Rate Limiting | 100 req/15min | Too restrictive for 1000 users |
| WebSocket Heartbeat | 60s interval | May cause delayed disconnection detection |
| Session Cleanup | 5 min interval | Acceptable for current scale |
| MongoDB | 10,000+ sessions | Not a bottleneck |

---

## 4. Current Server Specs (Estimated)

**Without access to the actual EC2 instance, estimated minimum specs based on port availability**:

```
Estimated Current Configuration:
- Instance Type: t2.medium or t3.medium
- vCPUs: 2
- RAM: 4-8 GB
- Network: Up to 5 Gbps
- Storage: 20-50 GB SSD

Actual Capacity with These Specs:
- Concurrent Sessions: 20-50 (comfortably)
- Maximum Sessions: 100 (under stress)
```

**To verify actual specs, run on the EC2 instance**:
```bash
# SSH into 18.209.65.32
ssh user@18.209.65.32

# Check CPU
lscpu | grep -E "^CPU\(s\)|Model name"

# Check Memory
free -h

# Check file descriptor limits
ulimit -n

# Check network
ifconfig | grep -E "inet|RX|TX"

# Check current Node.js processes
ps aux | grep node
pm2 status  # If using PM2
```

---

## 5. Requirements for 1000+ Concurrent Users

### 5.1 Server Specifications

#### Single-Server Vertical Scaling (Not Recommended)

```
Instance Type: m7i.4xlarge or c7i.4xlarge
- vCPUs: 16
- RAM: 64 GB
- Network: 12.5 Gbps
- Cost: ~$600-800/month

With Node.js Clustering (8 worker processes):
- Estimated Capacity: 800-1000 concurrent sessions
- Memory per session: 100-150MB
- Total memory: 100-150GB needed (exceeds single instance capacity)

Conclusion: Single-server vertical scaling insufficient for 1000+ users
```

#### Multi-Server Horizontal Scaling (Recommended)

**Load Balancer + Application Servers**:
```
Load Balancer:
- AWS Application Load Balancer (ALB)
- Cost: ~$20/month + data transfer

Application Servers (4x m7i.2xlarge):
- vCPUs: 8 each (32 total)
- RAM: 32 GB each (128 GB total)
- Network: 12.5 Gbps each
- Count: 4 servers
- Cost: ~$1,200/month

Each server capacity: 250 concurrent sessions
Total capacity: 1000 concurrent sessions
```

### 5.2 Architecture Changes Required

#### 5.2.1 Clustering with PM2

**Implement PM2 cluster mode**:

Create `F:/Development/cloud-desk/backend/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'clouddesk-api',
      script: './dist/server.js',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '2G',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 3000,
      kill_timeout: 5000,
    },
  ],
};
```

**Challenges with Current Architecture**:
```
CRITICAL ISSUE: WebSocket sessions are NOT cluster-friendly

Current Problems:
1. WebSocket connections are sticky to single worker process
2. SSH tunnels create local TCP servers (not shareable across processes)
3. Tunnel port allocation uses in-memory Map (not shared)
4. Session state is not shared across workers

Solution Required: Sticky sessions + shared state
```

#### 5.2.2 Sticky Sessions with Redis

**Required Infrastructure**:
```
Redis Cluster:
- AWS ElastiCache Redis (cluster mode enabled)
- Nodes: 3 replicas
- Instance: cache.r7g.large
- Memory: 13.07 GB per node
- Cost: ~$150/month

Purpose:
- Session affinity tracking
- Tunnel port allocation coordination
- WebSocket connection mapping
- Distributed locks
```

**Implementation Changes Required**:

```typescript
// backend/src/services/tunnelService.ts
// CHANGE: Use Redis for port allocation

import Redis from 'ioredis';

class TunnelService {
  private redis: Redis;
  private activeTunnels: Map<number, ActiveTunnel> = new Map();

  async allocatePort(): Promise<number> {
    const portRange = Array.from(
      { length: env.TUNNEL_PORT_RANGE_END - env.TUNNEL_PORT_RANGE_START },
      (_, i) => env.TUNNEL_PORT_RANGE_START + i
    );

    for (const port of portRange) {
      // Distributed lock with Redis
      const lockKey = `tunnel:port:${port}`;
      const acquired = await this.redis.set(
        lockKey,
        process.pid,
        'NX',
        'EX',
        3600 // 1 hour expiry
      );

      if (acquired) {
        return port;
      }
    }

    throw new TunnelError('No available ports for tunnel');
  }

  async releasePort(port: number): Promise<void> {
    const lockKey = `tunnel:port:${port}`;
    await this.redis.del(lockKey);
  }
}
```

#### 5.2.3 Load Balancer Configuration

**AWS Application Load Balancer**:

```yaml
# Load balancer configuration

Listeners:
  HTTP (80):
    - Redirect to HTTPS

  HTTPS (443):
    - Target Group: clouddesk-api
      Health Check: GET /api/health
      Healthy Threshold: 2
      Unhealthy Threshold: 3
      Timeout: 5s
      Interval: 30s

    - Target Group: clouddesk-websocket
      Protocol: HTTP
      Sticky Sessions: Enabled (cookie-based)
      Cookie Duration: 86400 (24 hours)
      Health Check: TCP /vnc

Target Groups:
  clouddesk-api:
    Port: 3000
    Protocol: HTTP
    Targets: [server-1:3000, server-2:3000, server-3:3000, server-4:3000]

  clouddesk-websocket:
    Port: 3000
    Protocol: HTTP
    Targets: [server-1:3000, server-2:3000, server-3:3000, server-4:3000]

Routing Rules:
  Path: /vnc -> clouddesk-websocket (sticky sessions)
  Path: /api/* -> clouddesk-api (round-robin)
```

#### 5.2.4 MongoDB Scaling

**Current Configuration**: Single MongoDB instance

**Recommended for 1000+ Users**:

```yaml
MongoDB Atlas Replica Set:
  Cluster Tier: M30
  RAM: 8 GB per node
  Storage: 100 GB
  Nodes: 3 (1 primary + 2 secondaries)
  Cost: ~$400/month

Configuration:
  Read Preference: primaryPreferred
  Write Concern: majority
  Connection Pool: 200 per server (800 total for 4 servers)

Performance:
  Write Capacity: 10,000 ops/second
  Read Capacity: 30,000 ops/second
  Sufficient for 1000+ concurrent sessions
```

**Connection String Update**:
```javascript
// backend/src/config/database.ts

mongoose.connect(env.MONGODB_URI, {
  maxPoolSize: 200, // Increase from default 100
  minPoolSize: 50,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4, // Use IPv4
});
```

#### 5.2.5 WebSocket Scaling Strategy

**Option 1: Sticky Sessions (Recommended for MVP)**

```
Advantages:
+ Simpler implementation
+ No code changes to WebSocket handling
+ Works with existing architecture

Disadvantages:
- Uneven load distribution if sessions are long-lived
- Server failures require session reconnection

Implementation:
- ALB sticky sessions (cookie-based)
- Session affinity duration: 24 hours
- Client-side reconnection logic on disconnect
```

**Option 2: Redis Pub/Sub (Advanced)**

```typescript
// Future enhancement for better scalability

import Redis from 'ioredis';

class VNCProxy {
  private redis: Redis;
  private subscriber: Redis;

  constructor(options: VNCProxyOptions) {
    this.redis = new Redis(env.REDIS_URL);
    this.subscriber = new Redis(env.REDIS_URL);

    // Subscribe to session messages
    this.subscriber.subscribe('vnc:messages');

    this.subscriber.on('message', (channel, message) => {
      const { sessionId, data } = JSON.parse(message);
      const conn = this.connections.get(sessionId);

      if (conn && conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(data);
      }
    });
  }

  private async handleWebSocketMessage(sessionId: string, data: Buffer) {
    // Publish to Redis for all workers
    await this.redis.publish(
      'vnc:messages',
      JSON.stringify({ sessionId, data: data.toString('base64') })
    );
  }
}
```

**Advantages**:
+ True horizontal scaling
+ Server failures transparent to clients
+ Better load distribution

**Disadvantages**:
- More complex implementation
- Redis bandwidth bottleneck
- Additional latency (5-15ms)

---

## 6. Detailed Infrastructure Blueprint

### 6.1 Network Architecture

```
                                  ┌─────────────────┐
                                  │   CloudFront    │
                                  │   (Optional)    │
                                  └────────┬────────┘
                                           │
                                  ┌────────▼────────┐
                                  │  Route 53 DNS   │
                                  └────────┬────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
           ┌────────▼────────┐    ┌───────▼────────┐    ┌───────▼────────┐
           │   ALB (HTTP)    │    │  ALB (WebSocket)│    │   WAF (DDoS)   │
           │   Port 80/443   │    │   Port 443      │    │   Protection   │
           └────────┬────────┘    └───────┬────────┘    └────────────────┘
                    │                     │
         ┌──────────┼─────────────────────┼──────────────────────┐
         │          │                     │                      │
    ┌────▼────┐┌───▼────┐┌───────────┐┌──▼──────┐┌────────────┤
    │Server 1 ││Server 2││ Server 3  ││Server 4 ││  Bastion   │
    │  :3000  ││ :3000  ││  :3000    ││ :3000   ││   Host     │
    └────┬────┘└───┬────┘└─────┬─────┘└────┬────┘└──────┬─────┘
         │         │            │           │            │
         └─────────┼────────────┼───────────┼────────────┘
                   │            │           │
              ┌────▼────────────▼───────────▼────┐
              │      Redis Cluster               │
              │  (Session State & Locks)         │
              └──────────────────┬───────────────┘
                                 │
              ┌──────────────────▼───────────────┐
              │   MongoDB Atlas Replica Set      │
              │   (Primary + 2 Secondaries)      │
              └──────────────────────────────────┘
```

### 6.2 Security Enhancements

**Current Security**:
- Helmet.js for HTTP headers
- CORS enabled (currently allows all origins)
- JWT authentication
- Rate limiting: 100 requests per 15 minutes
- SSH credentials encrypted in MongoDB

**Required Enhancements for Production**:

```javascript
// backend/src/app.ts - Updated CORS configuration

app.use(cors({
  origin: [
    'https://clouddesk.app',
    'https://www.clouddesk.app',
    /\.clouddesk\.app$/, // Allow subdomains
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

**WAF Rules**:
```yaml
AWS WAF Configuration:
  Rate-Based Rules:
    - Login endpoint: 5 requests per 5 minutes per IP
    - API endpoints: 1000 requests per 5 minutes per IP
    - WebSocket connections: 10 new connections per minute per IP

  Geo-Blocking:
    - Block high-risk countries (optional)

  SQL Injection Protection: Enabled
  XSS Protection: Enabled

  Custom Rules:
    - Block IPs with failed authentication > 10 times
    - Block excessive WebSocket reconnections
```

**Updated Rate Limiting**:
```javascript
// backend/src/middleware/rateLimiter.ts

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const authLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:auth:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:api:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased from 100
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const connectionLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:conn:',
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 new connections per minute
  message: 'Too many connection attempts, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
});
```

### 6.3 Monitoring and Observability

**Required Monitoring Stack**:

```yaml
CloudWatch Metrics:
  EC2 Metrics:
    - CPUUtilization (Target: < 70%)
    - NetworkIn/Out (Monitor for saturation)
    - DiskReadOps/WriteOps
    - StatusCheckFailed

  ALB Metrics:
    - TargetResponseTime (Target: < 100ms)
    - RequestCount
    - HTTPCode_Target_4XX_Count
    - HTTPCode_Target_5XX_Count
    - ActiveConnectionCount
    - RejectedConnectionCount

  Application Metrics:
    - Active VNC Sessions
    - Active SSH Tunnels
    - WebSocket Connections
    - Memory Usage per Process
    - Event Loop Lag

  MongoDB Metrics:
    - Connections
    - Operations/second
    - Replication Lag
    - Disk IOPS

CloudWatch Alarms:
  Critical:
    - CPU > 80% for 5 minutes
    - Memory > 85% for 5 minutes
    - Active sessions > 900 (approaching capacity)
    - 5xx errors > 10 in 5 minutes
    - MongoDB connections > 180 (90% of pool)

  Warning:
    - CPU > 60% for 10 minutes
    - Event loop lag > 100ms
    - WebSocket reconnections > 50/minute

Logging:
  Application Logs:
    - CloudWatch Logs
    - Log Level: INFO (production), DEBUG (development)
    - Retention: 30 days
    - Format: JSON structured logs

  Access Logs:
    - ALB access logs -> S3
    - Retention: 90 days
    - Analysis: AWS Athena
```

**Custom Application Metrics**:

```typescript
// backend/src/utils/metrics.ts

import { CloudWatch } from '@aws-sdk/client-cloudwatch';

const cloudwatch = new CloudWatch({ region: 'us-east-1' });

export class MetricsCollector {
  async reportActiveSessions(count: number): Promise<void> {
    await cloudwatch.putMetricData({
      Namespace: 'CloudDesk/Application',
      MetricData: [
        {
          MetricName: 'ActiveSessions',
          Value: count,
          Unit: 'Count',
          Timestamp: new Date(),
        },
      ],
    });
  }

  async reportEventLoopLag(lagMs: number): Promise<void> {
    await cloudwatch.putMetricData({
      Namespace: 'CloudDesk/Application',
      MetricData: [
        {
          MetricName: 'EventLoopLag',
          Value: lagMs,
          Unit: 'Milliseconds',
          Timestamp: new Date(),
        },
      ],
    });
  }

  async reportMemoryUsage(): Promise<void> {
    const memUsage = process.memoryUsage();

    await cloudwatch.putMetricData({
      Namespace: 'CloudDesk/Application',
      MetricData: [
        {
          MetricName: 'HeapUsed',
          Value: memUsage.heapUsed / 1024 / 1024, // MB
          Unit: 'Megabytes',
          Timestamp: new Date(),
        },
        {
          MetricName: 'RSS',
          Value: memUsage.rss / 1024 / 1024, // MB
          Unit: 'Megabytes',
          Timestamp: new Date(),
        },
      ],
    });
  }
}

// Collect metrics every 60 seconds
setInterval(() => {
  const collector = new MetricsCollector();

  collector.reportActiveSessions(connectionManager.getConnectionCount());
  collector.reportEventLoopLag(getEventLoopLag());
  collector.reportMemoryUsage();
}, 60000);
```

---

## 7. Cost Analysis

### 7.1 Current Estimated Costs (Single Server)

```
EC2 Instance (t3.medium):
- On-Demand: $30/month
- Reserved (1 year): $20/month

MongoDB Atlas (M10):
- Cluster: $60/month

Data Transfer:
- Ingress: Free
- Egress: ~$0.09/GB
- Estimated 1TB/month: $90/month

Total Current: ~$180/month (minimal scale)
```

### 7.2 Projected Costs for 1000+ Users

#### Infrastructure Costs

```
Load Balancer:
- ALB: $20/month base + $0.008/LCU-hour
- Estimated: $50/month

Application Servers (4x m7i.2xlarge):
- On-Demand: $1,200/month
- 1-Year Reserved: $750/month (37% savings)
- 3-Year Reserved: $480/month (60% savings)

Redis Cluster (ElastiCache):
- 3 nodes × cache.r7g.large: $150/month

MongoDB Atlas (M30 Replica Set):
- 3-node cluster: $400/month

CloudWatch:
- Logs: $5/month
- Metrics: $10/month
- Alarms: $1/month

Data Transfer (VNC traffic heavy):
- Average 2 Mbps per session
- 1000 sessions × 2 Mbps = 2 Gbps
- 30 days: ~648 TB/month
- Cost at $0.09/GB: $58,320/month
- With CloudFront: ~$35,000/month (40% reduction)

Route 53:
- Hosted Zone: $0.50/month
- Queries: $5/month

WAF (Optional):
- Web ACL: $5/month
- Rules: $1/rule/month × 10 = $10/month
- Requests: $0.60 per million

Backup & Disaster Recovery:
- EBS Snapshots: $20/month
- S3 Backup: $10/month
```

#### Total Monthly Costs

```
Conservative Estimate (On-Demand):
- Infrastructure: $1,850/month
- Data Transfer: $35,000/month (with CloudFront)
- Monitoring & Misc: $60/month
- TOTAL: ~$37,000/month

With Reserved Instances (1-year):
- Infrastructure: $1,400/month
- Data Transfer: $35,000/month
- Monitoring & Misc: $60/month
- TOTAL: ~$36,500/month

Annual Cost: ~$438,000/year

Cost per User (1000 concurrent):
- Per user per month: $36.50
- Per user per hour: ~$1.22
```

**Critical Note**: Data transfer is the dominant cost factor at 95% of total costs. Optimizing VNC compression and caching is essential.

### 7.3 Cost Optimization Strategies

```
1. VNC Compression:
   - Enable aggressive compression (quality vs. bandwidth tradeoff)
   - Estimated savings: 30-50% bandwidth reduction
   - Potential savings: $10,500-17,500/month

2. Reserved Instances:
   - 1-year commitment: 37% savings on compute
   - 3-year commitment: 60% savings on compute
   - Potential savings: $450-720/month

3. Auto-Scaling:
   - Scale down during off-peak hours
   - Estimated 30% reduction in server hours
   - Potential savings: $360/month

4. CloudFront CDN:
   - Already included in estimates
   - Reduces data transfer costs by 40%

5. Spot Instances (Advanced):
   - Use for non-critical worker nodes
   - Up to 90% discount vs. on-demand
   - Risk: Instance interruption
   - Potential savings: $800/month (if 2 of 4 servers use spot)

Total Potential Monthly Savings: $12,000-19,000/month
Optimized Monthly Cost: $18,000-24,500/month
```

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Objectives**:
- Set up monitoring and metrics collection
- Verify current server capacity
- Implement Redis for distributed state

**Tasks**:
1. Deploy CloudWatch monitoring
2. Implement custom metrics collection
3. Set up Redis ElastiCache cluster
4. Refactor tunnel service to use Redis for port allocation
5. Add health check endpoints
6. Load test current single-server setup (baseline)

**Deliverables**:
- Monitoring dashboard
- Redis integration completed
- Baseline performance metrics documented

### Phase 2: Database Scaling (Week 3)

**Objectives**:
- Migrate to MongoDB Atlas replica set
- Optimize database queries and indexes

**Tasks**:
1. Create MongoDB Atlas M30 cluster
2. Migrate data from current MongoDB
3. Update connection strings and pool settings
4. Add database indexes for frequent queries
5. Implement read preference strategies
6. Test database failover scenarios

**Deliverables**:
- Production-ready MongoDB cluster
- Database migration playbook
- Performance benchmarks

### Phase 3: Application Clustering (Week 4)

**Objectives**:
- Enable PM2 cluster mode
- Implement sticky session support

**Tasks**:
1. Create PM2 ecosystem config
2. Test cluster mode on single server
3. Verify WebSocket sticky sessions
4. Test tunnel port allocation across workers
5. Implement graceful shutdown for clustered workers
6. Load test clustered single server

**Deliverables**:
- PM2 configuration
- Cluster mode operational
- Updated capacity metrics

### Phase 4: Horizontal Scaling (Weeks 5-6)

**Objectives**:
- Deploy multiple application servers
- Set up Application Load Balancer
- Implement sticky sessions at load balancer level

**Tasks**:
1. Create EC2 Auto Scaling Group
2. Deploy ALB with sticky sessions
3. Configure health checks
4. Set up SSL/TLS certificates
5. Test cross-server session affinity
6. Implement Redis-based session tracking
7. Load test with 2-4 servers

**Deliverables**:
- Multi-server deployment
- Load balancer configured
- Session affinity verified
- Load test results for 500+ sessions

### Phase 5: Security Hardening (Week 7)

**Objectives**:
- Implement production security measures
- Add WAF and DDoS protection

**Tasks**:
1. Configure AWS WAF rules
2. Implement IP-based rate limiting with Redis
3. Harden CORS configuration
4. Enable AWS Shield Standard
5. Set up VPC security groups
6. Implement bastion host for SSH access
7. Security audit and penetration testing

**Deliverables**:
- Production security configuration
- Security audit report
- Hardened network architecture

### Phase 6: Performance Optimization (Week 8)

**Objectives**:
- Optimize VNC data transfer
- Tune WebSocket performance
- Minimize latency

**Tasks**:
1. Enable VNC compression tuning
2. Optimize WebSocket buffer sizes
3. Implement connection pooling for SSH
4. Tune TCP keepalive settings
5. Enable HTTP/2 for API endpoints
6. Optimize Node.js garbage collection settings
7. Load test with 1000+ concurrent sessions

**Deliverables**:
- Performance tuning documentation
- 1000+ concurrent session capacity verified
- Latency benchmarks

### Phase 7: Disaster Recovery (Week 9)

**Objectives**:
- Implement backup and recovery procedures
- Set up multi-AZ deployment

**Tasks**:
1. Configure automated EBS snapshots
2. Set up MongoDB Atlas backups
3. Implement cross-AZ redundancy
4. Create disaster recovery runbook
5. Test failover scenarios
6. Document recovery procedures

**Deliverables**:
- DR runbook
- Backup verification
- Multi-AZ deployment

### Phase 8: Production Deployment (Week 10)

**Objectives**:
- Deploy to production
- Monitor and validate

**Tasks**:
1. Final pre-production testing
2. DNS cutover planning
3. Production deployment
4. Monitor initial production traffic
5. Gradual traffic ramp-up
6. Post-deployment validation

**Deliverables**:
- Production system live
- 1000+ user capacity confirmed
- Post-deployment report

---

## 9. Specific Code Changes Required

### 9.1 Create PM2 Ecosystem Config

**File**: `F:/Development/cloud-desk/backend/ecosystem.config.js`

```javascript
module.exports = {
  apps: [
    {
      name: 'clouddesk-api',
      script: './dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      max_memory_restart: '2G',
      error_file: './logs/pm2-err.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 3000,
      kill_timeout: 5000,
      wait_ready: true,
      shutdown_with_message: true,
    },
  ],
};
```

### 9.2 Update Environment Variables

**File**: `F:/Development/cloud-desk/backend/.env.production`

```bash
# Server Configuration
NODE_ENV=production
PORT=3000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/clouddesk?retryWrites=true&w=majority

# Redis
REDIS_URL=redis://clouddesk-redis.abc123.ng.0001.use1.cache.amazonaws.com:6379

# JWT Configuration
JWT_ACCESS_SECRET=your-production-256-bit-access-secret-key-here
JWT_REFRESH_SECRET=your-production-256-bit-refresh-secret-key-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Encryption Key for SSH Credentials
ENCRYPTION_KEY=your-production-256-bit-encryption-key-here

# SSH Tunnel Port Range (expanded)
TUNNEL_PORT_RANGE_START=6000
TUNNEL_PORT_RANGE_END=10000

# Session Configuration
SESSION_TIMEOUT_MINUTES=30
MAX_SESSIONS_PER_USER=5

# Rate Limiting (increased for production)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# CORS
CORS_ORIGIN=https://clouddesk.app,https://www.clouddesk.app

# Logging
LOG_LEVEL=info

# AWS CloudWatch (optional)
AWS_REGION=us-east-1
ENABLE_CLOUDWATCH_METRICS=true

# Feature Flags
ENABLE_REDIS_SESSION_STORE=true
ENABLE_METRICS_COLLECTION=true
```

### 9.3 Add Redis Connection

**File**: `F:/Development/cloud-desk/backend/src/config/redis.ts`

```typescript
import Redis from 'ioredis';
import { env } from './environment';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;

export const connectRedis = (): Redis => {
  if (redisClient) {
    return redisClient;
  }

  redisClient = new Redis(env.REDIS_URL, {
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  redisClient.on('connect', () => {
    logger.info('Redis client connected');
  });

  redisClient.on('ready', () => {
    logger.info('Redis client ready');
  });

  redisClient.on('error', (err) => {
    logger.error('Redis client error:', err);
  });

  redisClient.on('close', () => {
    logger.warn('Redis client connection closed');
  });

  redisClient.on('reconnecting', () => {
    logger.info('Redis client reconnecting');
  });

  return redisClient;
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis client disconnected');
  }
};

export const getRedis = (): Redis => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

export { Redis };
```

### 9.4 Update Tunnel Service for Redis

**File**: `F:/Development/cloud-desk/backend/src/services/tunnelService.ts` (partial update)

```typescript
import { getRedis } from '../config/redis';

class TunnelService {
  private activeTunnels: Map<number, ActiveTunnel> = new Map();

  /**
   * Allocate port using distributed Redis lock
   */
  private async allocatePort(): Promise<number> {
    const redis = getRedis();
    const portRange = Array.from(
      { length: env.TUNNEL_PORT_RANGE_END - env.TUNNEL_PORT_RANGE_START },
      (_, i) => env.TUNNEL_PORT_RANGE_START + i
    );

    // Randomize port selection to reduce contention
    const shuffled = portRange.sort(() => Math.random() - 0.5);

    for (const port of shuffled) {
      const lockKey = `tunnel:port:${port}`;

      // Try to acquire distributed lock (NX = only set if not exists)
      const acquired = await redis.set(
        lockKey,
        `${process.pid}:${Date.now()}`,
        'NX',
        'EX',
        3600 // 1 hour expiry
      );

      if (acquired === 'OK') {
        logger.debug(`Allocated port ${port} via Redis lock`);
        return port;
      }
    }

    throw new TunnelError('No available ports for tunnel');
  }

  /**
   * Release port by deleting Redis lock
   */
  private async releasePort(port: number): Promise<void> {
    const redis = getRedis();
    const lockKey = `tunnel:port:${port}`;
    await redis.del(lockKey);
    logger.debug(`Released port ${port} Redis lock`);
  }

  /**
   * Create tunnel with Redis-coordinated port allocation
   */
  async createTunnel(
    sshClient: Client,
    remoteHost: string,
    remotePort: number,
    instanceId: string,
    sessionId: string
  ): Promise<TunnelInfo> {
    const localPort = await this.allocatePort();

    try {
      return new Promise((resolve, reject) => {
        const server = net.createServer((socket) => {
          sshClient.forwardOut(
            socket.remoteAddress || '127.0.0.1',
            socket.remotePort || 0,
            remoteHost,
            remotePort,
            (err, stream) => {
              if (err) {
                logger.error('Tunnel forward error:', err);
                socket.end();
                return;
              }

              socket.pipe(stream).pipe(socket);

              socket.on('error', (socketErr) => {
                logger.warn('Tunnel socket error:', socketErr);
                stream.end();
              });

              stream.on('error', (streamErr: Error) => {
                logger.warn('Tunnel stream error:', streamErr);
                socket.end();
              });

              socket.on('close', () => stream.end());
              stream.on('close', () => socket.end());
            }
          );
        });

        server.on('error', async (err) => {
          logger.error('Tunnel server error:', err);
          await this.releasePort(localPort);
          reject(new TunnelError(`Failed to create tunnel: ${err.message}`));
        });

        server.listen(localPort, '127.0.0.1', () => {
          const tunnelInfo: TunnelInfo = {
            localPort,
            remotePort,
            instanceId,
            sessionId,
            createdAt: new Date(),
          };

          this.activeTunnels.set(localPort, {
            info: tunnelInfo,
            server,
            sshClient,
          });

          logger.info(`Tunnel created: local ${localPort} -> remote ${remoteHost}:${remotePort}`);
          resolve(tunnelInfo);
        });
      });
    } catch (error) {
      await this.releasePort(localPort);
      throw error;
    }
  }

  /**
   * Close tunnel and release Redis lock
   */
  async closeTunnel(localPort: number): Promise<void> {
    const tunnel = this.activeTunnels.get(localPort);

    if (!tunnel) {
      logger.warn(`Tunnel not found on port ${localPort}`);
      return;
    }

    return new Promise((resolve) => {
      tunnel.server.close(async () => {
        this.activeTunnels.delete(localPort);
        await this.releasePort(localPort);
        logger.info(`Tunnel closed on port ${localPort}`);
        resolve();
      });
    });
  }
}
```

### 9.5 Add Health Check Endpoint

**File**: `F:/Development/cloud-desk/backend/src/routes/health.ts`

```typescript
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { getRedis } from '../config/redis';
import { tunnelService } from '../services/tunnelService';
import { connectionManager } from '../websocket/connectionManager';

const router = Router();

/**
 * Health check endpoint for load balancer
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      processId: process.pid,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      connections: {
        websockets: connectionManager.getConnectionCount(),
        tunnels: tunnelService.getActiveTunnelCount(),
      },
      dependencies: {
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        redis: 'unknown',
      },
    };

    // Check Redis connection
    try {
      const redis = getRedis();
      await redis.ping();
      health.dependencies.redis = 'connected';
    } catch (error) {
      health.dependencies.redis = 'disconnected';
      health.status = 'degraded';
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      health.status = 'unhealthy';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Readiness check - more strict than liveness
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check all dependencies are ready
    const checks = {
      mongodb: mongoose.connection.readyState === 1,
      redis: false,
    };

    // Verify Redis
    try {
      const redis = getRedis();
      await redis.ping();
      checks.redis = true;
    } catch {
      checks.redis = false;
    }

    const isReady = checks.mongodb && checks.redis;

    res.status(isReady ? 200 : 503).json({
      ready: isReady,
      checks,
    });
  } catch (error) {
    res.status(503).json({
      ready: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
```

**Update main routes**:

```typescript
// backend/src/routes/index.ts

import healthRoutes from './health';

// ... existing imports

router.use('/', healthRoutes);
// ... existing routes
```

---

## 10. Testing Strategy

### 10.1 Load Testing Plan

**Tool**: Artillery.io or k6

**Test Scenarios**:

```yaml
# artillery-config.yml

config:
  target: "https://api.clouddesk.app"
  phases:
    # Warm-up phase
    - duration: 60
      arrivalRate: 10
      name: "Warm-up"

    # Ramp-up to 500 users
    - duration: 300
      arrivalRate: 10
      rampTo: 100
      name: "Ramp to 500 concurrent users"

    # Sustained load
    - duration: 600
      arrivalRate: 100
      name: "Sustained 500 users"

    # Ramp to 1000 users
    - duration: 300
      arrivalRate: 100
      rampTo: 200
      name: "Ramp to 1000 users"

    # Peak load
    - duration: 600
      arrivalRate: 200
      name: "Sustained 1000 users"

scenarios:
  - name: "VNC Session Lifecycle"
    weight: 80
    flow:
      # Login
      - post:
          url: "/api/auth/login"
          json:
            email: "{{ $randomEmail() }}"
            password: "test123456"
          capture:
            - json: "$.data.accessToken"
              as: "token"

      # Get instances
      - get:
          url: "/api/instances"
          headers:
            Authorization: "Bearer {{ token }}"
          capture:
            - json: "$.data[0]._id"
              as: "instanceId"

      # Connect to instance
      - post:
          url: "/api/sessions/connect"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            instanceId: "{{ instanceId }}"
            desktopEnvironment: "xfce"
          capture:
            - json: "$.data.sessionId"
              as: "sessionId"
            - json: "$.data.websocketUrl"
              as: "wsUrl"

      # Establish WebSocket connection
      - ws:
          url: "wss://api.clouddesk.app{{ wsUrl }}&token={{ token }}"
          duration: 300
          onConnect:
            - send: "test-data"

      # Disconnect
      - post:
          url: "/api/sessions/disconnect/{{ sessionId }}"
          headers:
            Authorization: "Bearer {{ token }}"

  - name: "API Only Load"
    weight: 20
    flow:
      # Login
      - post:
          url: "/api/auth/login"
          json:
            email: "{{ $randomEmail() }}"
            password: "test123456"
          capture:
            - json: "$.data.accessToken"
              as: "token"

      # Get instances
      - get:
          url: "/api/instances"
          headers:
            Authorization: "Bearer {{ token }}"

      # Get active sessions
      - get:
          url: "/api/sessions/active"
          headers:
            Authorization: "Bearer {{ token }}"
```

**Key Metrics to Monitor**:
- Response time (p50, p95, p99)
- Error rate (target < 0.1%)
- WebSocket connection success rate (target > 99%)
- Session creation time (target < 5 seconds)
- Concurrent active sessions
- Server CPU and memory usage
- Database query latency
- Redis latency

### 10.2 Failover Testing

**Scenarios**:
1. Single server failure (test ALB failover)
2. MongoDB primary failover (test replica set)
3. Redis node failure (test cluster failover)
4. Network partition (test split-brain scenarios)
5. Graceful server shutdown (test session migration)

**Expected Results**:
- Zero data loss
- < 30 second recovery time
- Automatic reconnection for active sessions
- No manual intervention required

---

## 11. Rollback Plan

### 11.1 Rollback Triggers

Execute rollback if:
1. Error rate > 5% for 5 minutes
2. Response time p95 > 5 seconds for 10 minutes
3. WebSocket connection failure rate > 10%
4. Database connection failures
5. Critical security vulnerability discovered

### 11.2 Rollback Procedure

```bash
# 1. Immediate traffic diversion
aws elbv2 modify-target-group-attributes \
  --target-group-arn <arn> \
  --attributes Key=deregistration_delay.timeout_seconds,Value=0

# 2. Scale down new servers
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name clouddesk-new \
  --desired-capacity 0

# 3. Route traffic back to old infrastructure
aws route53 change-resource-record-sets \
  --hosted-zone-id <zone-id> \
  --change-batch file://rollback-dns.json

# 4. Monitor rollback
watch -n 5 'aws cloudwatch get-metric-statistics ...'

# 5. Verify old infrastructure stability
curl -f https://api.clouddesk.app/api/health

# 6. Post-mortem
# Document what went wrong
# Create incident report
# Plan remediation
```

---

## 12. Recommendations Summary

### Immediate Actions (Week 1)

1. **Deploy CloudWatch monitoring** to understand current load
2. **Implement Redis** for distributed state management
3. **Create PM2 cluster config** for multi-core utilization
4. **Add health check endpoints** for load balancer readiness

### Short-term (Weeks 2-4)

1. **Migrate to MongoDB Atlas** M30 replica set
2. **Enable PM2 cluster mode** on current server
3. **Implement sticky sessions** for WebSocket
4. **Increase tunnel port range** to 6000-10000

### Medium-term (Weeks 5-8)

1. **Deploy ALB and multiple EC2 instances** (4x m7i.2xlarge)
2. **Implement WAF rules** for security
3. **Optimize VNC compression** to reduce bandwidth costs
4. **Load test to 1000+ concurrent sessions**

### Long-term (Weeks 9-12)

1. **Set up disaster recovery** and multi-AZ deployment
2. **Implement auto-scaling** based on CloudWatch metrics
3. **Consider Redis Pub/Sub** for truly distributed WebSocket
4. **Evaluate CDN** for VNC traffic optimization

### Critical Success Factors

1. **Sticky Sessions**: Essential for WebSocket to work across multiple servers
2. **Redis Coordination**: Required for distributed port allocation
3. **Monitoring**: Must have visibility into capacity before scaling
4. **Gradual Rollout**: Don't switch all traffic at once
5. **Bandwidth Optimization**: VNC compression is critical for cost control

---

## 13. Open Questions for Investigation

1. **Current EC2 Instance Details**:
   - What is the actual instance type?
   - Current CPU, memory, network utilization?
   - File descriptor limits (ulimit -n)?

2. **Current Load**:
   - How many concurrent users currently?
   - Peak concurrent sessions observed?
   - Average session duration?

3. **VNC Configuration**:
   - What VNC compression level is currently used?
   - Average bandwidth per VNC session?
   - Desktop resolution settings?

4. **Budget**:
   - What is the monthly infrastructure budget?
   - Is data transfer cost acceptable at $35k/month for 1000 users?
   - Reserved instance commitment acceptable?

5. **Deployment Access**:
   - SSH access to 18.209.65.32?
   - AWS account access for infrastructure changes?
   - MongoDB Atlas account or self-hosted?

---

## Conclusion

The current CloudDesk backend architecture can support approximately **50-100 concurrent VNC sessions** comfortably. Scaling to **1000+ concurrent users** requires:

1. **Horizontal scaling** to 4+ application servers
2. **Load balancer** with sticky sessions for WebSocket
3. **Redis cluster** for distributed state coordination
4. **MongoDB Atlas replica set** for database reliability
5. **Aggressive VNC compression** to control bandwidth costs
6. **Comprehensive monitoring** and auto-scaling

**Estimated Monthly Cost**: $36,500/month (or $18,000-24,500 optimized)

**Implementation Timeline**: 10 weeks

**Key Risk**: Data transfer costs dominate at 95% of total expenses. VNC compression optimization is critical.

This analysis provides the foundation for making informed decisions about infrastructure scaling. Next steps should focus on validating current capacity with load testing and incrementally implementing the recommended architecture.
