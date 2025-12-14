/**
 * Client-side encryption utilities for sensitive data
 * Uses Web Crypto API for secure encryption/decryption
 */

// Constants for encryption
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 256;

/**
 * Derives an encryption key from a password using PBKDF2
 */
async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt plaintext with a password
 * Returns base64 encoded string in format: salt:iv:ciphertext
 */
export async function encryptWithPassword(
  plaintext: string,
  password: string
): Promise<string> {
  const encoder = new TextEncoder();

  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Derive key from password
  const key = await deriveKey(password, salt);

  // Encrypt the plaintext
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );

  // Combine salt, iv, and ciphertext
  const combined = new Uint8Array(
    salt.length + iv.length + ciphertext.byteLength
  );
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  // Return as base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt ciphertext with a password
 * Expects base64 encoded string containing salt:iv:ciphertext
 */
export async function decryptWithPassword(
  encryptedData: string,
  password: string
): Promise<string> {
  try {
    const decoder = new TextDecoder();

    // Decode from base64
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(c => c.charCodeAt(0))
    );

    // Extract salt, iv, and ciphertext
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH);

    // Derive key from password
    const key = await deriveKey(password, salt);

    // Decrypt
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    return decoder.decode(plaintext);
  } catch (error) {
    throw new Error('Decryption failed - incorrect password or corrupted data');
  }
}

/**
 * Check if data appears to be encrypted (simple heuristic)
 */
export function isEncrypted(data: string): boolean {
  // Encrypted data should be base64 and of sufficient length
  // Minimum: 16 (salt) + 12 (iv) + 1 (data) = 29 bytes = ~40 base64 chars
  if (data.length < 40) return false;

  try {
    // Try to decode as base64
    const decoded = atob(data);
    return decoded.length >= 29;
  } catch {
    return false;
  }
}

/**
 * Generate a password strength score (0-4)
 */
export function getPasswordStrength(password: string): {
  score: number;
  feedback: string;
} {
  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score < 2) feedback.push('Use a longer password');
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
    feedback.push('Add mixed case letters');
  }
  if (!/[0-9]/.test(password)) feedback.push('Add numbers');
  if (!/[^A-Za-z0-9]/.test(password)) feedback.push('Add special characters');

  return {
    score: Math.min(score, 4),
    feedback: feedback.join(', ') || 'Strong password',
  };
}
