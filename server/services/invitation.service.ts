/**
 * Invitation service.
 */

import { eq, and, count, isNull } from 'drizzle-orm';
import { db, schema } from '../db';
import { generateRandomToken } from '../lib/tokens';
import { NotFoundError, BadRequestError, InvitationExpiredError, DuplicateEmailError } from '../errors';

interface CreateInvitationData {
  email: string;
  role: 'admin' | 'member';
  organisationId: number;
  invitedById: number;
}

export async function createInvitation(data: CreateInvitationData) {
  // Check if email is already a member
  const [existingUser] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, data.email.toLowerCase()))
    .limit(1);

  if (existingUser) {
    const [existingMember] = await db
      .select()
      .from(schema.organisationMembers)
      .where(
        and(
          eq(schema.organisationMembers.organisationId, data.organisationId),
          eq(schema.organisationMembers.userId, existingUser.id)
        )
      )
      .limit(1);

    if (existingMember) {
      throw new BadRequestError('User is already a member of this organisation');
    }
  }

  // Check for pending invitation
  const [pendingInvite] = await db
    .select()
    .from(schema.invitations)
    .where(
      and(
        eq(schema.invitations.email, data.email.toLowerCase()),
        eq(schema.invitations.organisationId, data.organisationId),
        isNull(schema.invitations.acceptedAt)
      )
    )
    .limit(1);

  if (pendingInvite && pendingInvite.expiresAt > new Date()) {
    throw new BadRequestError('An invitation is already pending for this email');
  }

  // Generate token
  const token = generateRandomToken();

  // Create invitation (expires in 7 days)
  const [invitation] = await db
    .insert(schema.invitations)
    .values({
      organisationId: data.organisationId,
      email: data.email.toLowerCase(),
      token,
      role: data.role,
      invitedById: data.invitedById,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    .returning();

  // In production, send email with invitation link
  if (process.env.NODE_ENV === 'development') {
    console.log(`Invitation token for ${data.email}: ${token}`);
  }

  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    expiresAt: invitation.expiresAt,
    createdAt: invitation.createdAt,
  };
}

export async function getInvitations(
  organisationId: number,
  options: { page: number; limit: number }
) {
  const offset = (options.page - 1) * options.limit;

  const invitations = await db
    .select({
      id: schema.invitations.id,
      email: schema.invitations.email,
      role: schema.invitations.role,
      expiresAt: schema.invitations.expiresAt,
      acceptedAt: schema.invitations.acceptedAt,
      createdAt: schema.invitations.createdAt,
    })
    .from(schema.invitations)
    .where(eq(schema.invitations.organisationId, organisationId))
    .limit(options.limit)
    .offset(offset)
    .orderBy(schema.invitations.createdAt);

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(schema.invitations)
    .where(eq(schema.invitations.organisationId, organisationId));

  return { data: invitations, total };
}

export async function getInvitationByToken(token: string) {
  const [invitation] = await db
    .select({
      id: schema.invitations.id,
      email: schema.invitations.email,
      role: schema.invitations.role,
      expiresAt: schema.invitations.expiresAt,
      acceptedAt: schema.invitations.acceptedAt,
      organisationName: schema.organisations.name,
    })
    .from(schema.invitations)
    .innerJoin(schema.organisations, eq(schema.invitations.organisationId, schema.organisations.id))
    .where(eq(schema.invitations.token, token))
    .limit(1);

  if (!invitation) {
    throw new NotFoundError('Invitation');
  }

  if (invitation.acceptedAt) {
    throw new BadRequestError('Invitation has already been accepted');
  }

  if (invitation.expiresAt < new Date()) {
    throw new InvitationExpiredError();
  }

  return invitation;
}

export async function acceptInvitation(token: string, userId?: number) {
  const [invitation] = await db
    .select()
    .from(schema.invitations)
    .where(eq(schema.invitations.token, token))
    .limit(1);

  if (!invitation) {
    throw new NotFoundError('Invitation');
  }

  if (invitation.acceptedAt) {
    throw new BadRequestError('Invitation has already been accepted');
  }

  if (invitation.expiresAt < new Date()) {
    throw new InvitationExpiredError();
  }

  // Mark as accepted
  await db
    .update(schema.invitations)
    .set({ acceptedAt: new Date() })
    .where(eq(schema.invitations.id, invitation.id));

  return { success: true, organisationId: invitation.organisationId };
}

export async function cancelInvitation(invitationId: number, organisationId: number) {
  const [invitation] = await db
    .select()
    .from(schema.invitations)
    .where(
      and(
        eq(schema.invitations.id, invitationId),
        eq(schema.invitations.organisationId, organisationId)
      )
    )
    .limit(1);

  if (!invitation) {
    throw new NotFoundError('Invitation');
  }

  await db
    .delete(schema.invitations)
    .where(eq(schema.invitations.id, invitationId));
}
