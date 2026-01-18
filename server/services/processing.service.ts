/**
 * Processing service for data transformation pipeline.
 */

import { eq, and, count, desc } from 'drizzle-orm';
import { db, schema } from '../db';
import { NotFoundError, ProcessingInProgressError, BadRequestError } from '../errors';

interface QualitySettings {
  minLength?: number;
  maxLength?: number;
  removeDuplicates?: boolean;
  removeEmpty?: boolean;
}

export async function startProcessing(
  projectId: number,
  organisationId: number,
  userId: number,
  qualitySettings?: QualitySettings
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

  // Check for existing processing run
  const [existingRun] = await db
    .select()
    .from(schema.processingRuns)
    .where(
      and(
        eq(schema.processingRuns.projectId, projectId),
        eq(schema.processingRuns.status, 'processing')
      )
    )
    .limit(1);

  if (existingRun) {
    throw new ProcessingInProgressError();
  }

  // Get sources to calculate total records
  const sources = await db
    .select()
    .from(schema.sources)
    .where(
      and(
        eq(schema.sources.projectId, projectId),
        eq(schema.sources.status, 'ready')
      )
    );

  if (sources.length === 0) {
    throw new BadRequestError('No ready sources available for processing');
  }

  const totalRecords = sources.reduce((sum, s) => sum + (s.recordCount || 0), 0);

  // Create processing run
  const [run] = await db
    .insert(schema.processingRuns)
    .values({
      projectId,
      status: 'processing',
      configSnapshot: {
        targetSchema: project.targetSchema,
        qualitySettings: qualitySettings || {},
        sourceIds: sources.map(s => s.id),
      },
      totalRecords,
      processedRecords: 0,
      createdById: userId,
      startedAt: new Date(),
    })
    .returning();

  // Create processing stages
  const stages = ['extraction', 'pii_detection', 'mapping', 'quality_filter', 'export'];
  for (const stage of stages) {
    await db.insert(schema.processingStages).values({
      runId: run.id,
      stage,
      status: 'pending',
    });
  }

  // In a real implementation, this would trigger async processing
  // For now, we'll simulate immediate completion
  setTimeout(async () => {
    try {
      await simulateProcessing(run.id, totalRecords);
    } catch (error) {
      console.error('Processing error:', error);
    }
  }, 100);

  return run;
}

async function simulateProcessing(runId: number, totalRecords: number) {
  const stages = ['extraction', 'pii_detection', 'mapping', 'quality_filter', 'export'];

  for (const stage of stages) {
    // Update stage to processing
    await db
      .update(schema.processingStages)
      .set({
        status: 'processing',
        startedAt: new Date(),
        inputCount: totalRecords,
      })
      .where(
        and(
          eq(schema.processingStages.runId, runId),
          eq(schema.processingStages.stage, stage)
        )
      );

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update stage to completed
    await db
      .update(schema.processingStages)
      .set({
        status: 'completed',
        completedAt: new Date(),
        outputCount: totalRecords,
      })
      .where(
        and(
          eq(schema.processingStages.runId, runId),
          eq(schema.processingStages.stage, stage)
        )
      );
  }

  // Update run to completed
  await db
    .update(schema.processingRuns)
    .set({
      status: 'completed',
      processedRecords: totalRecords,
      completedAt: new Date(),
    })
    .where(eq(schema.processingRuns.id, runId));
}

export async function listRuns(
  projectId: number,
  organisationId: number,
  options: { page: number; limit: number }
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

  const runs = await db
    .select()
    .from(schema.processingRuns)
    .where(eq(schema.processingRuns.projectId, projectId))
    .limit(options.limit)
    .offset(offset)
    .orderBy(desc(schema.processingRuns.createdAt));

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(schema.processingRuns)
    .where(eq(schema.processingRuns.projectId, projectId));

  return { data: runs, total };
}

export async function getRun(runId: number, organisationId: number) {
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

  return run.processing_runs;
}

export async function getRunStages(runId: number, organisationId: number) {
  // Verify access
  await getRun(runId, organisationId);

  const stages = await db
    .select()
    .from(schema.processingStages)
    .where(eq(schema.processingStages.runId, runId))
    .orderBy(schema.processingStages.id);

  return stages;
}

export async function cancelRun(runId: number, organisationId: number) {
  const run = await getRun(runId, organisationId);

  if (run.status !== 'processing') {
    throw new BadRequestError('Can only cancel processing runs');
  }

  const [updated] = await db
    .update(schema.processingRuns)
    .set({
      status: 'cancelled',
      completedAt: new Date(),
    })
    .where(eq(schema.processingRuns.id, runId))
    .returning();

  return updated;
}
