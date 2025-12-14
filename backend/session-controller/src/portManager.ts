import Redis from 'ioredis';

const PORT_KEY_PREFIX = 'port:allocated:';

export class PortManager {
  private redis: Redis;
  private portRangeStart: number;
  private portRangeEnd: number;

  constructor(redis: Redis, portRangeStart: number = 8080, portRangeEnd: number = 8180) {
    this.redis = redis;
    this.portRangeStart = portRangeStart;
    this.portRangeEnd = portRangeEnd;
  }

  /**
   * Allocate an available port
   */
  async allocatePort(sessionId: string): Promise<number | null> {
    for (let port = this.portRangeStart; port <= this.portRangeEnd; port++) {
      const key = `${PORT_KEY_PREFIX}${port}`;
      // Try to acquire the port with NX (only if not exists) and set TTL
      const acquired = await this.redis.set(key, sessionId, 'EX', 86400, 'NX');
      if (acquired === 'OK') {
        console.log(`[PortManager] Allocated port ${port} for session ${sessionId}`);
        return port;
      }
    }
    console.error('[PortManager] No available ports');
    return null;
  }

  /**
   * Release a port
   */
  async releasePort(port: number): Promise<void> {
    const key = `${PORT_KEY_PREFIX}${port}`;
    await this.redis.del(key);
    console.log(`[PortManager] Released port ${port}`);
  }

  /**
   * Get session ID for a port
   */
  async getPortOwner(port: number): Promise<string | null> {
    const key = `${PORT_KEY_PREFIX}${port}`;
    return this.redis.get(key);
  }

  /**
   * Get all allocated ports
   */
  async getAllocatedPorts(): Promise<Map<number, string>> {
    const result = new Map<number, string>();
    const keys = await this.redis.keys(`${PORT_KEY_PREFIX}*`);

    for (const key of keys) {
      const port = parseInt(key.replace(PORT_KEY_PREFIX, ''), 10);
      const sessionId = await this.redis.get(key);
      if (sessionId) {
        result.set(port, sessionId);
      }
    }

    return result;
  }

  /**
   * Check if a port is allocated
   */
  async isPortAllocated(port: number): Promise<boolean> {
    const key = `${PORT_KEY_PREFIX}${port}`;
    const exists = await this.redis.exists(key);
    return exists === 1;
  }
}
