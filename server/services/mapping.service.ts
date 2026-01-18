/**
 * Field mapping service.
 */

import { eq, and } from 'drizzle-orm';
import { db, schema } from '../db';
import { NotFoundError } from '../errors';

interface CreateMappingData {
  sourceFieldId: number;
  targetField: string;
  transformation?: {
    type?: 'direct' | 'concatenate' | 'template' | 'format';
    config?: Record<string, unknown>;
  };
}

interface UpdateMappingData {
  targetField?: string;
  transformation?: {
    type?: 'direct' | 'concatenate' | 'template' | 'format';
    config?: Record<string, unknown>;
  };
  isActive?: boolean;
}

// Standard schema definitions
const standardSchemas = {
  qa_pairs: {
    name: 'Q&A Pairs',
    fields: [
      { name: 'question', type: 'string', required: true },
      { name: 'answer', type: 'string', required: true },
      { name: 'context', type: 'string', required: false },
    ],
  },
  instruction: {
    name: 'Instruction Following',
    fields: [
      { name: 'instruction', type: 'string', required: true },
      { name: 'input', type: 'string', required: false },
      { name: 'output', type: 'string', required: true },
    ],
  },
  chat: {
    name: 'Chat/Conversation',
    fields: [
      { name: 'messages', type: 'array', required: true },
      { name: 'system', type: 'string', required: false },
    ],
  },
  structured: {
    name: 'Structured Data',
    fields: [
      { name: 'input', type: 'object', required: true },
      { name: 'output', type: 'object', required: true },
    ],
  },
};

export async function getProjectSchema(projectId: number, organisationId: number) {
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

  const schemaType = project.targetSchema as keyof typeof standardSchemas;
  const schemaDefinition = schemaType ? standardSchemas[schemaType] : null;

  return {
    targetSchema: project.targetSchema,
    schemaDefinition,
    availableSchemas: Object.entries(standardSchemas).map(([key, value]) => ({
      id: key,
      name: value.name,
      fields: value.fields,
    })),
  };
}

export async function updateProjectSchema(
  projectId: number,
  organisationId: number,
  data: { targetSchema: string; customSchema?: { fields: Array<{ name: string; type: string; required?: boolean }> } }
) {
  const [project] = await db
    .update(schema.projects)
    .set({
      targetSchema: data.targetSchema,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.projects.id, projectId),
        eq(schema.projects.organisationId, organisationId)
      )
    )
    .returning();

  if (!project) {
    throw new NotFoundError('Project');
  }

  return getProjectSchema(projectId, organisationId);
}

export async function getMappings(projectId: number, organisationId: number) {
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

  const mappings = await db
    .select({
      id: schema.fieldMappings.id,
      sourceFieldId: schema.fieldMappings.sourceFieldId,
      targetField: schema.fieldMappings.targetField,
      transformation: schema.fieldMappings.transformation,
      isActive: schema.fieldMappings.isActive,
      sourceFieldName: schema.sourceFields.name,
      sourceFieldPath: schema.sourceFields.path,
      sourceFieldDataType: schema.sourceFields.dataType,
    })
    .from(schema.fieldMappings)
    .innerJoin(schema.sourceFields, eq(schema.fieldMappings.sourceFieldId, schema.sourceFields.id))
    .where(eq(schema.fieldMappings.projectId, projectId));

  return mappings;
}

export async function createMapping(
  projectId: number,
  organisationId: number,
  data: CreateMappingData
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

  const [mapping] = await db
    .insert(schema.fieldMappings)
    .values({
      projectId,
      sourceFieldId: data.sourceFieldId,
      targetField: data.targetField,
      transformation: data.transformation,
    })
    .returning();

  return mapping;
}

export async function updateMapping(
  mappingId: number,
  organisationId: number,
  data: UpdateMappingData
) {
  // Verify access through project
  const [existing] = await db
    .select()
    .from(schema.fieldMappings)
    .innerJoin(schema.projects, eq(schema.fieldMappings.projectId, schema.projects.id))
    .where(
      and(
        eq(schema.fieldMappings.id, mappingId),
        eq(schema.projects.organisationId, organisationId)
      )
    )
    .limit(1);

  if (!existing) {
    throw new NotFoundError('Mapping');
  }

  const [mapping] = await db
    .update(schema.fieldMappings)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(schema.fieldMappings.id, mappingId))
    .returning();

  return mapping;
}

export async function deleteMapping(mappingId: number, organisationId: number) {
  // Verify access through project
  const [existing] = await db
    .select()
    .from(schema.fieldMappings)
    .innerJoin(schema.projects, eq(schema.fieldMappings.projectId, schema.projects.id))
    .where(
      and(
        eq(schema.fieldMappings.id, mappingId),
        eq(schema.projects.organisationId, organisationId)
      )
    )
    .limit(1);

  if (!existing) {
    throw new NotFoundError('Mapping');
  }

  await db.delete(schema.fieldMappings).where(eq(schema.fieldMappings.id, mappingId));
}
