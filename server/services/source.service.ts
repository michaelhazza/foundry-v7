/**
 * Source service.
 */

import { eq, and, count } from 'drizzle-orm';
import { db, schema } from '../db';
import { NotFoundError, BadRequestError } from '../errors';
import * as fileParserService from './file-parser.service';
import { encrypt } from '../lib/encryption';

interface ApiSourceData {
  name: string;
  connectorType: 'teamwork' | 'gohighlevel';
  connectorConfig: Record<string, unknown>;
}

export async function listSources(
  projectId: number,
  organisationId: number,
  options: { page: number; limit: number }
) {
  // Verify project belongs to organisation
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

  const sources = await db
    .select()
    .from(schema.sources)
    .where(eq(schema.sources.projectId, projectId))
    .limit(options.limit)
    .offset(offset)
    .orderBy(schema.sources.createdAt);

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(schema.sources)
    .where(eq(schema.sources.projectId, projectId));

  return { data: sources, total };
}

export async function uploadSource(
  projectId: number,
  organisationId: number,
  file: Express.Multer.File
) {
  // Verify project belongs to organisation
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

  // Determine file type
  const extension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
  let fileType: 'csv' | 'xlsx' | 'json';
  if (extension === '.csv') fileType = 'csv';
  else if (extension === '.xlsx' || extension === '.xls') fileType = 'xlsx';
  else if (extension === '.json') fileType = 'json';
  else throw new BadRequestError('Unsupported file type');

  // Create source record
  const [source] = await db
    .insert(schema.sources)
    .values({
      projectId,
      name: file.originalname,
      type: 'file',
      status: 'processing',
      fileName: file.originalname,
      fileType,
      fileSize: file.size,
      filePath: '', // Will be set after parsing
    })
    .returning();

  try {
    // Parse file and detect fields
    const parseResult = await fileParserService.parseFile(file.buffer, fileType);

    // Update source with record count
    await db
      .update(schema.sources)
      .set({
        status: 'ready',
        recordCount: parseResult.recordCount,
        updatedAt: new Date(),
      })
      .where(eq(schema.sources.id, source.id));

    // Create source fields
    for (const field of parseResult.fields) {
      await db.insert(schema.sourceFields).values({
        sourceId: source.id,
        name: field.name,
        path: field.path,
        dataType: field.dataType,
        sampleValues: field.sampleValues,
        nullCount: field.nullCount,
        uniqueCount: field.uniqueCount,
      });
    }

    return { ...source, status: 'ready', recordCount: parseResult.recordCount };
  } catch (error) {
    // Update source with error
    await db
      .update(schema.sources)
      .set({
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        updatedAt: new Date(),
      })
      .where(eq(schema.sources.id, source.id));

    throw error;
  }
}

export async function createApiSource(
  projectId: number,
  organisationId: number,
  data: ApiSourceData
) {
  // Verify project belongs to organisation
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

  // Encrypt sensitive config
  const encryptedConfig = encrypt(JSON.stringify(data.connectorConfig));

  const [source] = await db
    .insert(schema.sources)
    .values({
      projectId,
      name: data.name,
      type: 'api',
      status: 'pending',
      connectorType: data.connectorType,
      connectorConfig: { encrypted: encryptedConfig },
    })
    .returning();

  return source;
}

export async function testConnector(
  connectorType: string,
  connectorConfig: Record<string, unknown>
) {
  // Test connector connection
  // In a real implementation, this would make API calls to verify credentials
  return { success: true, message: 'Connection successful' };
}

export async function getSource(sourceId: number, organisationId: number) {
  const [source] = await db
    .select()
    .from(schema.sources)
    .innerJoin(schema.projects, eq(schema.sources.projectId, schema.projects.id))
    .where(
      and(
        eq(schema.sources.id, sourceId),
        eq(schema.projects.organisationId, organisationId)
      )
    )
    .limit(1);

  if (!source) {
    throw new NotFoundError('Source');
  }

  return source.sources;
}

export async function getSourcePreview(
  sourceId: number,
  organisationId: number,
  limit: number
) {
  await getSource(sourceId, organisationId);

  // Return sample data
  // In a real implementation, this would read from the stored file
  return { records: [], total: 0 };
}

export async function getSourceFields(sourceId: number, organisationId: number) {
  await getSource(sourceId, organisationId);

  const fields = await db
    .select()
    .from(schema.sourceFields)
    .where(eq(schema.sourceFields.sourceId, sourceId));

  return fields;
}

export async function syncSource(sourceId: number, organisationId: number) {
  const source = await getSource(sourceId, organisationId);

  if (source.type !== 'api') {
    throw new BadRequestError('Only API sources can be synced');
  }

  // In a real implementation, this would fetch data from the API
  return { success: true, recordCount: 0 };
}

export async function deleteSource(sourceId: number, organisationId: number) {
  await getSource(sourceId, organisationId);

  await db.delete(schema.sources).where(eq(schema.sources.id, sourceId));
}
