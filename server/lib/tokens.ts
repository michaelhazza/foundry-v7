/**
 * JWT token utilities.
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

interface TokenPayload {
  userId: number;
  email: string;
  organisationId: number;
}

/**
 * Generate a JWT access token.
 */
export function generateAccessToken(payload: TokenPayload): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

/**
 * Verify a JWT access token.
 */
export function verifyAccessToken(token: string): TokenPayload {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  return jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
}

/**
 * Generate a random token for password reset or invitations.
 */
export function generateRandomToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a token for storage.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
