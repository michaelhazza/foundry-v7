/**
 * Audit service for tracking events and data lineage.
 */

import { eq, and, count, desc } from 'drizzle-orm';
import { db, schema } from '../db';
import { NotFoundError } from '../errors';

interface CreateAuditEventData {
  projectId: number;
  userId?: number;
  eventType: string;
  eventData?: Record<string, unknown>;
  resourceType?: string;
  resourceId?: number;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditEvent(data: CreateAuditEventData) {
  const [event] = await db
    .insert(schema.auditEvents)
    .values(data)
    .returning();

  return event;
}

export async function listEvents(
  projectId: number,
  organisationId: number,
  options: { page: number; limit: number; eventType?: string }
) {
  // Verify project access
  const [project] = await db
    .select()
    .from(schema.projects)
    .where(
      and(
        eq(schema.projects.id, projectId),
        eq(schema.projects.organisationId, organisationId)
      )
    )
    .limit(1);

  if (!project) {
    throw new NotFoundError('Project');
  }

  const offset = (options.page - 1) * options.limit;

  let whereClause = eq(schema.auditEvents.projectId, projectId);
  if (options.eventType) {
    whereClause = and(whereClause, eq(schema.auditEvents.eventType, options.eventType))!;
  }

  const events = await db
    .select({
      id: schema.auditEvents.id,
      eventType: schema.auditEvents.eventType,
      eventData: schema.auditEvents.eventData,
      resourceType: schema.auditEvents.resourceType,
      resourceId: schema.auditEvents.resourceId,
      createdAt: schema.auditEvents.createdAt,
      userName: schema.users.name,
    })
    .from(schema.auditEvents)
    .leftJoin(schema.users, eq(schema.auditEvents.userId, schema.users.id))
    .where(whereClause)
    .limit(options.limit)
    .offset(offset)
    .orderBy(desc(schema.auditEvents.createdAt));

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(schema.auditEvents)
    .where(whereClause);

  return { data: events, total };
}

export async function getLineage(projectId: number, organisationId: number) {
  // Verify project access
  const [project] = await db
    .select()
    .from(schema.projects)
    .where(
      and(
        eq(schema.projects.id, projectId),
        eq(schema.projects.organisationId, organisationId)
      )
    )
    .limit(1);

  if (!project) {
    throw new NotFoundError('Project');
  }

  // Get sources
  const sources = await db
    .select({
      id: schema.sources.id,
      name: schema.sources.name,
      type: schema.sources.type,
      recordCount: schema.sources.recordCount,
      createdAt: schema.sources.createdAt,
    })
    .from(schema.sources)
    .where(eq(schema.sources.projectId, projectId));

  // Get processing runs
  const runs = await db
    .select({
      id: schema.processingRuns.id,
      status: schema.processingRuns.status,
      totalRecords: schema.processingRuns.totalRecords,
      processedRecords: schema.processingRuns.processedRecords,
      createdAt: schema.processingRuns.createdAt,
      completedAt: schema.processingRuns.completedAt,
    })
    .from(schema.processingRuns)
    .where(eq(schema.processingRuns.projectId, projectId))
    .orderBy(desc(schema.processingRuns.createdAt));

  // Get exports
  const exports = await db
    .select({
      id: schema.exports.id,
      runId: schema.exports.runId,
      format: schema.exports.format,
      recordCount: schema.exports.recordCount,
      createdAt: schema.exports.createdAt,
    })
    .from(schema.exports)
    .innerJoin(schema.processingRuns, eq(schema.exports.runId, schema.processingRuns.id))
    .where(eq(schema.processingRuns.projectId, projectId));

  return {
    sources,
    processingRuns: runs,
    exports,
    // Build lineage graph nodes and edges
    nodes: [
      ...sources.map(s => ({ id: `source-${s.id}`, type: 'source', label: s.name })),
      ...runs.map(r => ({ id: `run-${r.id}`, type: 'processing', label: `Run #${r.id}` })),
      ...exports.map(e => ({ id: `export-${e.id}`, type: 'export', label: e.format })),
    ],
    edges: [
      // Sources to runs (simplified - all sources feed into all runs)
      ...runs.flatMap(r =>
        sources.map(s => ({ from: `source-${s.id}`, to: `run-${r.id}` }))
      ),
      // Runs to exports
      ...exports.map(e => ({ from: `run-${e.runId}`, to: `export-${e.id}` })),
    ],
  };
}

export async function getPiiSummary(projectId: number, organisationId: number) {
  // Verify project access
  const [project] = await db
    .select()
    .from(schema.projects)
    .where(
      and(
        eq(schema.projects.id, projectId),
        eq(schema.projects.organisationId, organisationId)
      )
    )
    .limit(1);

  if (!project) {
    throw new NotFoundError('Project');
  }

  // Get all PII rules for project sources
  const rules = await db
    .select({
      piiType: schema.piiRules.piiType,
      handling: schema.piiRules.handling,
      fieldName: schema.sourceFields.name,
      sourceName: schema.sources.name,
    })
    .from(schema.piiRules)
    .innerJoin(schema.sources, eq(schema.piiRules.sourceId, schema.sources.id))
    .innerJoin(schema.sourceFields, eq(schema.piiRules.sourceFieldId, schema.sourceFields.id))
    .where(eq(schema.sources.projectId, projectId));

  // Group by PII type
  const byType: Record<string, number> = {};
  const byHandling: Record<string, number> = {};

  for (const rule of rules) {
    byType[rule.piiType] = (byType[rule.piiType] || 0) + 1;
    byHandling[rule.handling] = (byHandling[rule.handling] || 0) + 1;
  }

  return {
    totalRules: rules.length,
    byType: Object.entries(byType).map(([type, count]) => ({ type, count })),
    byHandling: Object.entries(byHandling).map(([handling, count]) => ({ handling, count })),
    rules: rules.map(r => ({
      field: `${r.sourceName}.${r.fieldName}`,
      piiType: r.piiType,
      handling: r.handling,
    })),
  };
}

export async function getRunLineage(runId: number, organisationId: number) {
  // Verify access
  const [run] = await db
    .select()
    .from(schema.processingRuns)
    .innerJoin(schema.projects, eq(schema.processingRuns.projectId, schema.projects.id))
    .where(
      and(
        eq(schema.processingRuns.id, runId),
        eq(schema.projects.organisationId, organisationId)
      )
    )
    .limit(1);

  if (!run) {
    throw new NotFoundError('Processing Run');
  }

  // Get stages for this run
  const stages = await db
    .select()
    .from(schema.processingStages)
    .where(eq(schema.processingStages.runId, runId))
    .orderBy(schema.processingStages.id);

  // Get config snapshot
  const configSnapshot = run.processing_runs.configSnapshot as {
    sourceIds?: number[];
    targetSchema?: string;
    qualitySettings?: Record<string, unknown>;
  };

  return {
    runId,
    status: run.processing_runs.status,
    configSnapshot,
    stages: stages.map(s => ({
      stage: s.stage,
      status: s.status,
      inputCount: s.inputCount,
      outputCount: s.outputCount,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
    })),
    metrics: {
      totalRecords: run.processing_runs.totalRecords,
      processedRecords: run.processing_runs.processedRecords,
      filteredRecords: run.processing_runs.filteredRecords,
      errorRecords: run.processing_runs.errorRecords,
    },
  };
}
