import { env } from './environment';

// AES-256-CBC configuration
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // AES block size
const KEY_LENGTH = 32; // 256 bits

// Convert hex string to Buffer
const getEncryptionKey = (): Buffer => {
  const key = Buffer.from(env.ENCRYPTION_KEY, 'hex');
  if (key.length !== KEY_LENGTH) {
    throw new Error(`Encryption key must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 2} hex characters)`);
  }
  return key;
};

export const encryptionConfig = {
  algorithm: ALGORITHM,
  ivLength: IV_LENGTH,
  keyLength: KEY_LENGTH,
  getKey: getEncryptionKey,
};

export default encryptionConfig;
