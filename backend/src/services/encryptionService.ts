import crypto from 'crypto';
import { encryptionConfig } from '../config/encryption';
import { logger } from '../utils/logger';

// Constants for client-side decryption (matching frontend encryption)
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH_GCM = 12;
const KEY_LENGTH_BITS = 256;

class EncryptionService {
  private readonly algorithm: string;
  private readonly ivLength: number;
  private key: Buffer | null = null;

  constructor() {
    this.algorithm = encryptionConfig.algorithm;
    this.ivLength = encryptionConfig.ivLength;
  }

  /**
   * Get the encryption key (lazy loaded)
   */
  private getKey(): Buffer {
    if (!this.key) {
      this.key = encryptionConfig.getKey();
    }
    return this.key;
  }

  /**
   * Encrypt plaintext using AES-256-CBC
   * Returns base64 encoded string in format: iv:ciphertext
   */
  encrypt(plaintext: string): string {
    try {
      // Generate a random IV for each encryption
      const iv = crypto.randomBytes(this.ivLength);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.getKey(), iv);

      // Encrypt the plaintext
      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      // Return IV + ciphertext separated by colon
      const ivBase64 = iv.toString('base64');
      return `${ivBase64}:${encrypted}`;
    } catch (error) {
      logger.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt ciphertext using AES-256-CBC (server-side encryption)
   * Expects base64 encoded string in format: iv:ciphertext
   */
  decrypt(ciphertext: string): string {
    try {
      // Split IV and encrypted data
      const parts = ciphertext.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid ciphertext format');
      }

      const [ivBase64, encryptedData] = parts;

      // Decode IV from base64
      const iv = Buffer.from(ivBase64, 'base64');
      if (iv.length !== this.ivLength) {
        throw new Error('Invalid IV length');
      }

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.getKey(), iv);

      // Decrypt the ciphertext
      let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Decrypt client-side encrypted data using user's password
   * Mirrors the frontend encryptWithPassword function
   * Format: base64 encoded (salt + iv + ciphertext + authTag)
   */
  decryptWithPassword(encryptedData: string, password: string): string {
    try {
      // Decode from base64
      const combined = Buffer.from(encryptedData, 'base64');

      // Extract salt, iv, and ciphertext+authTag
      const salt = combined.subarray(0, SALT_LENGTH);
      const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH_GCM);
      const ciphertextWithTag = combined.subarray(SALT_LENGTH + IV_LENGTH_GCM);

      // AES-GCM auth tag is 16 bytes at the end
      const authTagLength = 16;
      const ciphertext = ciphertextWithTag.subarray(0, ciphertextWithTag.length - authTagLength);
      const authTag = ciphertextWithTag.subarray(ciphertextWithTag.length - authTagLength);

      // Derive key from password using PBKDF2
      const key = crypto.pbkdf2Sync(
        password,
        salt,
        PBKDF2_ITERATIONS,
        KEY_LENGTH_BITS / 8,
        'sha256'
      );

      // Create decipher with AES-256-GCM
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(ciphertext);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString('utf8');
    } catch (error) {
      logger.error('Client-side decryption failed:', error);
      throw new Error('Failed to decrypt with password - incorrect password or corrupted data');
    }
  }

  /**
   * Full decryption: Server-side first, then client-side with password
   */
  decryptCredential(encryptedCredential: string, userPassword: string): string {
    // First, decrypt the server-side encryption layer
    const clientEncrypted = this.decrypt(encryptedCredential);

    // Then, decrypt the client-side encryption layer with user's password
    return this.decryptWithPassword(clientEncrypted, userPassword);
  }

  /**
   * Generate a secure random string
   */
  generateSecureString(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash a string using SHA-256
   */
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Compare two strings in constant time (prevents timing attacks)
   */
  secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();

export default encryptionService;
