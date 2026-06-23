import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // AES block size

// Retrieve key from environment or use a default development key
const rawKey = process.env.ENCRYPTION_KEY || 'default-dev-key-at-least-32-chars-long-!!!';
// Derive a secure 32-byte key from the raw key using SHA-256
const ENCRYPTION_KEY = crypto.createHash('sha256').update(rawKey).digest();

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  // Store iv with output as hex
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decrypt(text: string): string {
  const parts = text.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted text format');
  }
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
