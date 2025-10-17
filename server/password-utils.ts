import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Hash a public upload code using bcrypt (like Zoom meeting codes)
 * Used for secure verification without exposing the plain code
 */
export async function hashUploadCode(code: string): Promise<string> {
  return await bcrypt.hash(code, SALT_ROUNDS);
}

/**
 * Verify a public upload code against its hash
 * Returns true if the code matches the stored hash
 */
export async function verifyUploadCode(plainCode: string, hashedCode: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plainCode, hashedCode);
  } catch (error) {
    console.error('Upload code verification error:', error);
    return false;
  }
}
