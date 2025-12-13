import crypto from 'crypto';

/**
 * Generate a random string of specified length
 */
export const generateRandomString = (length: number): string => {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

/**
 * Generate a random password with specified length
 * Includes uppercase, lowercase, numbers, and special characters
 */
export const generateRandomPassword = (length: number = 16): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  const all = uppercase + lowercase + numbers + special;

  let password = '';
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
};

/**
 * Parse JWT expiry string to milliseconds
 * Supports formats like: 15m, 1h, 7d, 30d
 */
export const parseExpiryToMs = (expiry: string): number => {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid expiry format: ${expiry}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
};

/**
 * Parse JWT expiry string to seconds
 */
export const parseExpiryToSeconds = (expiry: string): number => {
  return Math.floor(parseExpiryToMs(expiry) / 1000);
};

/**
 * Sleep for specified milliseconds
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Retry a function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  maxDelay: number = 10000
): Promise<T> => {
  let lastError: Error | undefined;
  let delay = initialDelay;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries - 1) {
        await sleep(delay);
        delay = Math.min(delay * 2, maxDelay);
      }
    }
  }

  throw lastError;
};

/**
 * Check if a port is available
 */
export const isPortAvailable = (port: number, usedPorts: Set<number>): boolean => {
  return !usedPorts.has(port);
};

/**
 * Find an available port in a range
 */
export const findAvailablePort = (
  start: number,
  end: number,
  usedPorts: Set<number>
): number | null => {
  for (let port = start; port <= end; port++) {
    if (isPortAvailable(port, usedPorts)) {
      return port;
    }
  }
  return null;
};

/**
 * Sanitize string for safe logging (remove sensitive data patterns)
 */
export const sanitizeForLogging = (str: string): string => {
  // Remove potential passwords
  let sanitized = str.replace(/password['":\s]*['"]?[^'"\s,}]*/gi, 'password: [REDACTED]');
  // Remove potential tokens
  sanitized = sanitized.replace(/token['":\s]*['"]?[^'"\s,}]*/gi, 'token: [REDACTED]');
  // Remove potential keys
  sanitized = sanitized.replace(/key['":\s]*['"]?[^'"\s,}]*/gi, 'key: [REDACTED]');
  // Remove base64 encoded data that might be keys
  sanitized = sanitized.replace(/-----BEGIN[^-]+-----[^-]+-----END[^-]+-----/g, '[REDACTED KEY]');

  return sanitized;
};

/**
 * Mask an IP address for logging
 */
export const maskIpAddress = (ip: string): string => {
  if (ip.includes(':')) {
    // IPv6 - mask last 4 groups
    const parts = ip.split(':');
    if (parts.length > 4) {
      return parts.slice(0, 4).join(':') + ':****:****:****:****';
    }
  } else {
    // IPv4 - mask last 2 octets
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.***`;
    }
  }
  return ip;
};

/**
 * Validate that a string is a valid SSH private key
 */
export const isValidSSHKey = (key: string): boolean => {
  const keyTypes = [
    '-----BEGIN RSA PRIVATE KEY-----',
    '-----BEGIN OPENSSH PRIVATE KEY-----',
    '-----BEGIN DSA PRIVATE KEY-----',
    '-----BEGIN EC PRIVATE KEY-----',
    '-----BEGIN PRIVATE KEY-----',
  ];

  return keyTypes.some((type) => key.trim().startsWith(type));
};

/**
 * Extract the key type from an SSH private key
 */
export const getSSHKeyType = (key: string): string | null => {
  const keyTypes: Record<string, string> = {
    '-----BEGIN RSA PRIVATE KEY-----': 'RSA',
    '-----BEGIN OPENSSH PRIVATE KEY-----': 'OpenSSH',
    '-----BEGIN DSA PRIVATE KEY-----': 'DSA',
    '-----BEGIN EC PRIVATE KEY-----': 'ECDSA',
    '-----BEGIN PRIVATE KEY-----': 'PKCS8',
  };

  for (const [prefix, type] of Object.entries(keyTypes)) {
    if (key.trim().startsWith(prefix)) {
      return type;
    }
  }

  return null;
};

/**
 * Format bytes to human readable string
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Calculate VNC port from display number
 */
export const vncDisplayToPort = (displayNumber: number): number => {
  return 5900 + displayNumber;
};

/**
 * Calculate display number from VNC port
 */
export const vncPortToDisplay = (port: number): number => {
  return port - 5900;
};

/**
 * Omit specified keys from an object
 */
export const omit = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
};

/**
 * Pick specified keys from an object
 */
export const pick = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
};

export default {
  generateRandomString,
  generateRandomPassword,
  parseExpiryToMs,
  parseExpiryToSeconds,
  sleep,
  retryWithBackoff,
  isPortAvailable,
  findAvailablePort,
  sanitizeForLogging,
  maskIpAddress,
  isValidSSHKey,
  getSSHKeyType,
  formatBytes,
  vncDisplayToPort,
  vncPortToDisplay,
  omit,
  pick,
};
