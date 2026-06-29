const crypto = require('crypto');
import { PARTNER_SECRET_SALT, PARTNER_IV_SALT } from '../config/constants.js';

// The encryption key MUST be exactly 32 bytes (256 bits)
const ENCRYPTION_KEY = crypto.createHash('sha256').update(PARTNER_SECRET_SALT).digest();
const STATIC_IV = crypto.createHash('md5').update(PARTNER_IV_SALT).digest();

// 12 bytes of data mathematically encodes to exactly 16 Base64url characters
const REQUIRED_BYTES = 12;
const EXACT_CHAR_COUNT = 16;

// Encrypts the partner_id with 8 bytes of random padding to hit exactly 16 characters
export const generatePartnerToken = (partnerId) => {
  const buffer = Buffer.alloc(REQUIRED_BYTES);

  // 1. Write the partner ID as a 32-bit unsigned integer (occupies 4 bytes)
  buffer.writeUInt32BE(Number(partnerId), 0);

  // 2. Fill the remaining 8 bytes with pure high-entropy randomness
  crypto.randomBytes(8).copy(buffer, 4);

  // 3. Encrypt the entire 12-byte block
  const cipher = crypto.createCipheriv('aes-256-ctr', ENCRYPTION_KEY, STATIC_IV);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);

  // 4. Convert to base64url string (12 bytes always translates to exactly 16 characters)
  return encrypted.toString('base64url');
};

// Decrypts a strict 16-character token and extracts the partner_id
export const validatePartnerToken = (token) => {
  // Strict length check: Reject immediately if it's not exactly 16 characters
  if (!token || token.length !== EXACT_CHAR_COUNT) return null;

  try {
    const encryptedBuffer = Buffer.from(token, 'base64url');

    const decipher = crypto.createDecipheriv('aes-256-ctr', ENCRYPTION_KEY, STATIC_IV);
    const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);

    // Extract the integer from the first 4 bytes, stripping away the random padding
    return { partner_id: decrypted.readUInt32BE(0) };
  } catch (error) {
    return null;
  }
};
