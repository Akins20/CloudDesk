import crypto from 'crypto';
import { env } from '../config/environment';
import { logger } from './logger';

// Ed25519 key pair for license signing
let privateKey: crypto.KeyObject | null = null;
let publicKey: crypto.KeyObject | null = null;

/**
 * Initialize signing keys from environment
 */
export function initializeKeys(): void {
  try {
    if (env.LICENSE_PRIVATE_KEY) {
      const privateKeyPem = Buffer.from(env.LICENSE_PRIVATE_KEY, 'base64').toString('utf8');
      privateKey = crypto.createPrivateKey(privateKeyPem);
      logger.info('License signing private key loaded');
    }

    if (env.LICENSE_PUBLIC_KEY) {
      const publicKeyPem = Buffer.from(env.LICENSE_PUBLIC_KEY, 'base64').toString('utf8');
      publicKey = crypto.createPublicKey(publicKeyPem);
      logger.info('License signing public key loaded');
    }

    // If no keys provided, generate a new pair (for development)
    if (!privateKey && env.NODE_ENV === 'development') {
      const keyPair = crypto.generateKeyPairSync('ed25519');
      privateKey = keyPair.privateKey;
      publicKey = keyPair.publicKey;
      logger.warn('Generated new Ed25519 key pair for development. Do not use in production!');

      // Log the keys for development setup
      const privPem = keyPair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
      const pubPem = keyPair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
      logger.debug('Private key (base64):', Buffer.from(privPem).toString('base64'));
      logger.debug('Public key (base64):', Buffer.from(pubPem).toString('base64'));
    }
  } catch (error) {
    logger.error('Failed to initialize signing keys:', error);
    throw error;
  }
}

/**
 * Sign data with the private key
 */
export function signData(data: string): string {
  if (!privateKey) {
    throw new Error('Private key not initialized');
  }
  const signature = crypto.sign(null, Buffer.from(data), privateKey);
  return signature.toString('base64url');
}

/**
 * Verify signature with the public key
 */
export function verifySignature(data: string, signature: string): boolean {
  if (!publicKey) {
    throw new Error('Public key not initialized');
  }
  try {
    return crypto.verify(null, Buffer.from(data), publicKey, Buffer.from(signature, 'base64url'));
  } catch {
    return false;
  }
}

/**
 * Generate a random string
 */
export function generateRandomString(length: number = 32): string {
  return crypto.randomBytes(length).toString('base64url').substring(0, length);
}

/**
 * Hash a string with SHA-256
 */
export function hashSHA256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Hash a license key for database lookup
 */
export function hashLicenseKey(key: string): string {
  return hashSHA256(key.toUpperCase().trim());
}

/**
 * Get the public key in PEM format (for embedding in CloudDesk instances)
 */
export function getPublicKeyPem(): string {
  if (!publicKey) {
    throw new Error('Public key not initialized');
  }
  return publicKey.export({ type: 'spki', format: 'pem' }).toString();
}
