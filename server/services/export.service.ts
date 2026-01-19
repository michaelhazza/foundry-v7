/**
 * Export service for generating output files.
 */

import { eq, and, count, desc } from 'drizzle-orm';
import { Readable } from 'stream';
import { db, schema } from '../db';
import { NotFoundError, BadRequestError } from '../errors';

export async function createExport(
  runId: number,
  organisationId: number,
  userId: number,
  format: 'jsonl' | 'csv' | 'parquet'
) {
  // Verify run access and is completed
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

  if (run.processing_runs.status !== 'completed') {
    throw new BadRequestError('Can only export completed processing runs');
  }

  const fileName = `export_${runId}_${Date.now()}.${format}`;
  const filePath = `/exports/${fileName}`;

  const [exportRecord] = await db
    .insert(schema.exports)
    .values({
      runId,
      format,
      fileName,
      filePath,
      fileSize: 0,
      recordCount: run.processing_runs.processedRecords,
      createdById: userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    })
    .returning();

  return exportRecord;
}

export async function listExports(
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

  const exports = await db
    .select({
      id: schema.exports.id,
      runId: schema.exports.runId,
      format: schema.exports.format,
      fileName: schema.exports.fileName,
      fileSize: schema.exports.fileSize,
      recordCount: schema.exports.recordCount,
      downloadCount: schema.exports.downloadCount,
      expiresAt: schema.exports.expiresAt,
      createdAt: schema.exports.createdAt,
    })
    .from(schema.exports)
    .innerJoin(schema.processingRuns, eq(schema.exports.runId, schema.processingRuns.id))
    .where(eq(schema.processingRuns.projectId, projectId))
    .limit(options.limit)
    .offset(offset)
    .orderBy(desc(schema.exports.createdAt));

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(schema.exports)
    .innerJoin(schema.processingRuns, eq(schema.exports.runId, schema.processingRuns.id))
    .where(eq(schema.processingRuns.projectId, projectId));

  return { data: exports, total };
}

export async function getExport(exportId: number, organisationId: number) {
  const [exportRecord] = await db
    .select()
    .from(schema.exports)
    .innerJoin(schema.processingRuns, eq(schema.exports.runId, schema.processingRuns.id))
    .innerJoin(schema.projects, eq(schema.processingRuns.projectId, schema.projects.id))
    .where(
      and(
        eq(schema.exports.id, exportId),
        eq(schema.projects.organisationId, organisationId)
      )
    )
    .limit(1);

  if (!exportRecord) {
    throw new NotFoundError('Export');
  }

  return exportRecord.exports;
}

export async function downloadExport(exportId: number, organisationId: number) {
  const exportRecord = await getExport(exportId, organisationId);

  // Check if expired
  if (exportRecord.expiresAt && exportRecord.expiresAt < new Date()) {
    throw new BadRequestError('Export has expired');
  }

  // Increment download count
  await db
    .update(schema.exports)
    .set({
      downloadCount: (exportRecord.downloadCount || 0) + 1,
    })
    .where(eq(schema.exports.id, exportId));

  // In a real implementation, this would read from file storage
  // For now, return a mock stream
  const mimeTypes: Record<string, string> = {
    jsonl: 'application/jsonl',
    csv: 'text/csv',
    parquet: 'application/octet-stream',
  };

  const mockData = JSON.stringify({ sample: 'data' }) + '\n';
  const stream = Readable.from([mockData]);

  return {
    stream,
    fileName: exportRecord.fileName,
    mimeType: mimeTypes[exportRecord.format] || 'application/octet-stream',
  };
}

export async function deleteExport(exportId: number, organisationId: number) {
  await getExport(exportId, organisationId);

  // In a real implementation, also delete the file from storage
  await db.delete(schema.exports).where(eq(schema.exports.id, exportId));
}
