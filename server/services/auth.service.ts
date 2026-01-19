/**
 * Authentication service.
 */

import { eq } from 'drizzle-orm';
import { db, schema } from '../db';
import { hashPassword, comparePassword } from '../lib/password';
import { generateAccessToken, generateRandomToken, hashToken } from '../lib/tokens';
import {
  BadRequestError,
  UnauthorizedError,
  DuplicateEmailError,
  TokenInvalidError,
} from '../errors';

interface RegisterData {
  email: string;
  password: string;
  name: string;
  organisationName?: string;
  inviteToken?: string;
}

interface LoginData {
  email: string;
  password: string;
}

export async function register(data: RegisterData) {
  // Check if email already exists
  const [existingUser] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, data.email.toLowerCase()))
    .limit(1);

  if (existingUser) {
    throw new DuplicateEmailError();
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);

  // Create user
  const [user] = await db
    .insert(schema.users)
    .values({
      email: data.email.toLowerCase(),
      passwordHash,
      name: data.name,
    })
    .returning();

  // Create or join organisation
  let organisationId: number;
  let role: 'admin' | 'member' = 'admin';

  if (data.inviteToken) {
    // Accept invitation
    const [invitation] = await db
      .select()
      .from(schema.invitations)
      .where(eq(schema.invitations.token, data.inviteToken))
      .limit(1);

    if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
      throw new TokenInvalidError();
    }

    organisationId = invitation.organisationId;
    role = invitation.role as 'admin' | 'member';

    // Mark invitation as accepted
    await db
      .update(schema.invitations)
      .set({ acceptedAt: new Date() })
      .where(eq(schema.invitations.id, invitation.id));
  } else {
    // Create new organisation
    const orgName = data.organisationName || `${data.name}'s Organisation`;
    const [org] = await db
      .insert(schema.organisations)
      .values({ name: orgName })
      .returning();

    organisationId = org.id;
  }

  // Add user to organisation
  await db.insert(schema.organisationMembers).values({
    organisationId,
    userId: user.id,
    role,
  });

  // Generate token
  const token = generateAccessToken({
    userId: user.id,
    email: user.email,
    organisationId,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      organisationId,
      role,
    },
    token,
  };
}

export async function login(data: LoginData) {
  // Find user
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, data.email.toLowerCase()))
    .limit(1);

  if (!user) {
    throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  // Verify password
  const isValid = await comparePassword(data.password, user.passwordHash);
  if (!isValid) {
    throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  // Get organisation membership
  const [membership] = await db
    .select()
    .from(schema.organisationMembers)
    .where(eq(schema.organisationMembers.userId, user.id))
    .limit(1);

  if (!membership) {
    throw new UnauthorizedError('User not in any organisation');
  }

  // Generate token
  const token = generateAccessToken({
    userId: user.id,
    email: user.email,
    organisationId: membership.organisationId,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      organisationId: membership.organisationId,
      role: membership.role as 'admin' | 'member',
    },
    token,
  };
}

export async function getCurrentUser(userId: number) {
  const [user] = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  const [membership] = await db
    .select()
    .from(schema.organisationMembers)
    .where(eq(schema.organisationMembers.userId, userId))
    .limit(1);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    organisationId: membership?.organisationId,
    role: membership?.role as 'admin' | 'member',
  };
}

export async function forgotPassword(email: string) {
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()))
    .limit(1);

  if (!user) {
    // Don't reveal if email exists
    return;
  }

  // Generate reset token
  const token = generateRandomToken();
  const tokenHash = hashToken(token);

  // Save token
  await db.insert(schema.passwordResetTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  });

  // In production, send email with reset link
  // For now, log the token (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log(`Password reset token for ${email}: ${token}`);
  }
}

export async function resetPassword(token: string, newPassword: string) {
  const tokenHash = hashToken(token);

  // Find valid token
  const [resetToken] = await db
    .select()
    .from(schema.passwordResetTokens)
    .where(eq(schema.passwordResetTokens.tokenHash, tokenHash))
    .limit(1);

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw new TokenInvalidError();
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update password
  await db
    .update(schema.users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(schema.users.id, resetToken.userId));

  // Mark token as used
  await db
    .update(schema.passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(schema.passwordResetTokens.id, resetToken.id));
}
