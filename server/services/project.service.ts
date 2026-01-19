/**
 * Project service.
 */

import { eq, and, count, isNull, sql } from 'drizzle-orm';
import { db, schema } from '../db';
import { NotFoundError, ConflictError } from '../errors';

interface CreateProjectData {
  name: string;
  description?: string;
  organisationId: number;
  createdById: number;
}

interface UpdateProjectData {
  name?: string;
  description?: string;
  targetSchema?: 'qa_pairs' | 'instruction' | 'chat' | 'structured' | 'custom';
}

export async function listProjects(
  organisationId: number,
  options: { page: number; limit: number; status?: string }
) {
  const offset = (options.page - 1) * options.limit;

  let whereClause = and(
    eq(schema.projects.organisationId, organisationId),
    isNull(schema.projects.deletedAt)
  );

  if (options.status) {
    whereClause = and(whereClause, eq(schema.projects.status, options.status));
  }

  const projects = await db
    .select()
    .from(schema.projects)
    .where(whereClause)
    .limit(options.limit)
    .offset(offset)
    .orderBy(schema.projects.createdAt);

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(schema.projects)
    .where(whereClause);

  return { data: projects, total };
}

export async function createProject(data: CreateProjectData) {
  // Check for duplicate name in organisation
  const [existing] = await db
    .select()
    .from(schema.projects)
    .where(
      and(
        eq(schema.projects.organisationId, data.organisationId),
        eq(schema.projects.name, data.name),
        isNull(schema.projects.deletedAt)
      )
    )
    .limit(1);

  if (existing) {
    throw new ConflictError('A project with this name already exists');
  }

  const [project] = await db
    .insert(schema.projects)
    .values({
      name: data.name,
      description: data.description,
      organisationId: data.organisationId,
      createdById: data.createdById,
    })
    .returning();

  return project;
}

export async function getProject(projectId: number, organisationId: number) {
  const [project] = await db
    .select()
    .from(schema.projects)
    .where(
      and(
        eq(schema.projects.id, projectId),
        eq(schema.projects.organisationId, organisationId),
        isNull(schema.projects.deletedAt)
      )
    )
    .limit(1);

  if (!project) {
    throw new NotFoundError('Project');
  }

  return project;
}

export async function updateProject(
  projectId: number,
  organisationId: number,
  data: UpdateProjectData
) {
  // Check project exists
  const [existing] = await db
    .select()
    .from(schema.projects)
    .where(
      and(
        eq(schema.projects.id, projectId),
        eq(schema.projects.organisationId, organisationId),
        isNull(schema.projects.deletedAt)
      )
    )
    .limit(1);

  if (!existing) {
    throw new NotFoundError('Project');
  }

  // Check for duplicate name if name is being changed
  if (data.name && data.name !== existing.name) {
    const [duplicate] = await db
      .select()
      .from(schema.projects)
      .where(
        and(
          eq(schema.projects.organisationId, organisationId),
          eq(schema.projects.name, data.name),
          isNull(schema.projects.deletedAt)
        )
      )
      .limit(1);

    if (duplicate) {
      throw new ConflictError('A project with this name already exists');
    }
  }

  const [project] = await db
    .update(schema.projects)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(schema.projects.id, projectId))
    .returning();

  return project;
}

export async function deleteProject(projectId: number, organisationId: number) {
  // Soft delete
  const [project] = await db
    .update(schema.projects)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.projects.id, projectId),
        eq(schema.projects.organisationId, organisationId),
        isNull(schema.projects.deletedAt)
      )
    )
    .returning();

  if (!project) {
    throw new NotFoundError('Project');
  }
}

export async function getProjectStats(projectId: number, organisationId: number) {
  // Verify project exists and belongs to organisation
  await getProject(projectId, organisationId);

  // Get source count
  const [{ value: sourceCount }] = await db
    .select({ value: count() })
    .from(schema.sources)
    .where(eq(schema.sources.projectId, projectId));

  // Get total records from sources
  const [recordsResult] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${schema.sources.recordCount}), 0)`,
    })
    .from(schema.sources)
    .where(eq(schema.sources.projectId, projectId));

  // Get processing runs count
  const [{ value: runCount }] = await db
    .select({ value: count() })
    .from(schema.processingRuns)
    .where(eq(schema.processingRuns.projectId, projectId));

  // Get export count
  const [{ value: exportCount }] = await db
    .select({ value: count() })
    .from(schema.exports)
    .innerJoin(
      schema.processingRuns,
      eq(schema.exports.runId, schema.processingRuns.id)
    )
    .where(eq(schema.processingRuns.projectId, projectId));

  return {
    sourceCount,
    totalRecords: recordsResult?.total || 0,
    runCount,
    exportCount,
  };
}
