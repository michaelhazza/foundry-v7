/**
 * Authentication middleware.
 * Validates JWT tokens and attaches user context to requests.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../errors';
import { db, schema } from '../db';
import { eq, and } from 'drizzle-orm';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name: string;
        organisationId: number;
        role: 'admin' | 'member';
      };
    }
  }
}

interface JwtPayload {
  userId: number;
  email: string;
  organisationId: number;
}

/**
 * Middleware to authenticate JWT tokens.
 */
export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

    // Get user with organisation membership
    const [user] = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
      })
      .from(schema.users)
      .where(eq(schema.users.id, decoded.userId))
      .limit(1);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Get user's organisation membership
    const [membership] = await db
      .select({
        organisationId: schema.organisationMembers.organisationId,
        role: schema.organisationMembers.role,
      })
      .from(schema.organisationMembers)
      .where(eq(schema.organisationMembers.userId, user.id))
      .limit(1);

    if (!membership) {
      throw new UnauthorizedError('User not in any organisation');
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      organisationId: membership.organisationId,
      role: membership.role as 'admin' | 'member',
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expired', 'TOKEN_EXPIRED'));
    } else {
      next(error);
    }
  }
}

/**
 * Middleware to require a specific role.
 */
export function requireRole(...roles: Array<'admin' | 'member'>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
}

export default authMiddleware;
