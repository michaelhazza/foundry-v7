/**
 * Organisation service.
 */

import { eq, and, count } from 'drizzle-orm';
import { db, schema } from '../db';
import { NotFoundError, ForbiddenError, BadRequestError } from '../errors';

export async function getOrganisation(organisationId: number) {
  const [org] = await db
    .select()
    .from(schema.organisations)
    .where(eq(schema.organisations.id, organisationId))
    .limit(1);

  if (!org) {
    throw new NotFoundError('Organisation');
  }

  return org;
}

export async function updateOrganisation(
  organisationId: number,
  data: { name: string }
) {
  const [org] = await db
    .update(schema.organisations)
    .set({ name: data.name, updatedAt: new Date() })
    .where(eq(schema.organisations.id, organisationId))
    .returning();

  if (!org) {
    throw new NotFoundError('Organisation');
  }

  return org;
}

export async function getMembers(
  organisationId: number,
  options: { page: number; limit: number }
) {
  const offset = (options.page - 1) * options.limit;

  const members = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      role: schema.organisationMembers.role,
      createdAt: schema.organisationMembers.createdAt,
    })
    .from(schema.organisationMembers)
    .innerJoin(schema.users, eq(schema.organisationMembers.userId, schema.users.id))
    .where(eq(schema.organisationMembers.organisationId, organisationId))
    .limit(options.limit)
    .offset(offset);

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(schema.organisationMembers)
    .where(eq(schema.organisationMembers.organisationId, organisationId));

  return { data: members, total };
}

export async function updateMemberRole(
  organisationId: number,
  memberId: number,
  newRole: 'admin' | 'member',
  currentUserId: number
) {
  // Can't change own role
  if (memberId === currentUserId) {
    throw new BadRequestError('Cannot change your own role');
  }

  // Check member exists in organisation
  const [membership] = await db
    .select()
    .from(schema.organisationMembers)
    .where(
      and(
        eq(schema.organisationMembers.organisationId, organisationId),
        eq(schema.organisationMembers.userId, memberId)
      )
    )
    .limit(1);

  if (!membership) {
    throw new NotFoundError('Member');
  }

  // Update role
  await db
    .update(schema.organisationMembers)
    .set({ role: newRole })
    .where(eq(schema.organisationMembers.id, membership.id));

  // Get updated member
  const [member] = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      role: schema.organisationMembers.role,
    })
    .from(schema.organisationMembers)
    .innerJoin(schema.users, eq(schema.organisationMembers.userId, schema.users.id))
    .where(eq(schema.organisationMembers.id, membership.id))
    .limit(1);

  return member;
}

export async function removeMember(
  organisationId: number,
  memberId: number,
  currentUserId: number
) {
  // Can't remove yourself
  if (memberId === currentUserId) {
    throw new BadRequestError('Cannot remove yourself from the organisation');
  }

  // Check member exists
  const [membership] = await db
    .select()
    .from(schema.organisationMembers)
    .where(
      and(
        eq(schema.organisationMembers.organisationId, organisationId),
        eq(schema.organisationMembers.userId, memberId)
      )
    )
    .limit(1);

  if (!membership) {
    throw new NotFoundError('Member');
  }

  // Check we're not removing the last admin
  if (membership.role === 'admin') {
    const [{ value: adminCount }] = await db
      .select({ value: count() })
      .from(schema.organisationMembers)
      .where(
        and(
          eq(schema.organisationMembers.organisationId, organisationId),
          eq(schema.organisationMembers.role, 'admin')
        )
      );

    if (adminCount <= 1) {
      throw new BadRequestError('Cannot remove the last admin');
    }
  }

  // Remove member
  await db
    .delete(schema.organisationMembers)
    .where(eq(schema.organisationMembers.id, membership.id));
}
