/**
 * PII detection and handling service.
 */

import { eq, and } from 'drizzle-orm';
import { db, schema } from '../db';
import { NotFoundError } from '../errors';

// PII detection patterns
const piiPatterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
  ssn: /^\d{3}-?\d{2}-?\d{4}$/,
  credit_card: /^\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}$/,
};

// Common PII field name patterns
const piiFieldPatterns = {
  email: ['email', 'e-mail', 'emailaddress', 'email_address'],
  phone: ['phone', 'telephone', 'mobile', 'cell', 'phonenumber', 'phone_number'],
  name: ['name', 'firstname', 'lastname', 'first_name', 'last_name', 'fullname', 'full_name'],
  address: ['address', 'street', 'city', 'state', 'zip', 'zipcode', 'postal', 'country'],
  ssn: ['ssn', 'social_security', 'socialsecurity', 'social'],
  credit_card: ['credit_card', 'creditcard', 'card_number', 'cardnumber', 'cc_number'],
};

interface CreatePiiRuleData {
  sourceFieldId: number;
  piiType: 'email' | 'phone' | 'name' | 'address' | 'ssn' | 'credit_card' | 'custom';
  handling: 'mask' | 'redact' | 'hash' | 'keep';
  customPattern?: string;
}

interface UpdatePiiRuleData {
  handling?: 'mask' | 'redact' | 'hash' | 'keep';
  customPattern?: string;
}

export async function detectPii(sourceId: number, organisationId: number) {
  // Verify access
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

  // Get source fields
  const fields = await db
    .select()
    .from(schema.sourceFields)
    .where(eq(schema.sourceFields.sourceId, sourceId));

  const detectedPii: Array<{
    sourceFieldId: number;
    fieldName: string;
    piiType: string;
    confidence: number;
    handling: string;
  }> = [];

  for (const field of fields) {
    const fieldNameLower = field.name.toLowerCase().replace(/[^a-z]/g, '');

    // Check field name patterns
    for (const [piiType, patterns] of Object.entries(piiFieldPatterns)) {
      if (patterns.some(p => fieldNameLower.includes(p))) {
        detectedPii.push({
          sourceFieldId: field.id,
          fieldName: field.name,
          piiType,
          confidence: 90,
          handling: piiType === 'name' ? 'mask' : 'redact',
        });
        break;
      }
    }

    // Check sample values against patterns
    if (field.sampleValues && Array.isArray(field.sampleValues)) {
      for (const [piiType, pattern] of Object.entries(piiPatterns)) {
        const matchCount = field.sampleValues.filter(v =>
          typeof v === 'string' && pattern.test(v)
        ).length;

        if (matchCount > field.sampleValues.length * 0.5) {
          // More than 50% match
          if (!detectedPii.some(d => d.sourceFieldId === field.id)) {
            detectedPii.push({
              sourceFieldId: field.id,
              fieldName: field.name,
              piiType,
              confidence: Math.round((matchCount / field.sampleValues.length) * 100),
              handling: 'redact',
            });
          }
        }
      }
    }
  }

  return detectedPii;
}

export async function getPiiRules(sourceId: number, organisationId: number) {
  // Verify access
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

  const rules = await db
    .select({
      id: schema.piiRules.id,
      sourceFieldId: schema.piiRules.sourceFieldId,
      piiType: schema.piiRules.piiType,
      handling: schema.piiRules.handling,
      confidence: schema.piiRules.confidence,
      isAutoDetected: schema.piiRules.isAutoDetected,
      customPattern: schema.piiRules.customPattern,
      fieldName: schema.sourceFields.name,
    })
    .from(schema.piiRules)
    .innerJoin(schema.sourceFields, eq(schema.piiRules.sourceFieldId, schema.sourceFields.id))
    .where(eq(schema.piiRules.sourceId, sourceId));

  return rules;
}

export async function createPiiRule(
  sourceId: number,
  organisationId: number,
  data: CreatePiiRuleData
) {
  // Verify access
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

  const [rule] = await db
    .insert(schema.piiRules)
    .values({
      sourceId,
      sourceFieldId: data.sourceFieldId,
      piiType: data.piiType,
      handling: data.handling,
      confidence: 100,
      isAutoDetected: false,
      customPattern: data.customPattern,
    })
    .returning();

  return rule;
}

export async function updatePiiRule(
  ruleId: number,
  organisationId: number,
  data: UpdatePiiRuleData
) {
  // Verify access
  const [existing] = await db
    .select()
    .from(schema.piiRules)
    .innerJoin(schema.sources, eq(schema.piiRules.sourceId, schema.sources.id))
    .innerJoin(schema.projects, eq(schema.sources.projectId, schema.projects.id))
    .where(
      and(
        eq(schema.piiRules.id, ruleId),
        eq(schema.projects.organisationId, organisationId)
      )
    )
    .limit(1);

  if (!existing) {
    throw new NotFoundError('PII Rule');
  }

  const [rule] = await db
    .update(schema.piiRules)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(schema.piiRules.id, ruleId))
    .returning();

  return rule;
}

export async function deletePiiRule(ruleId: number, organisationId: number) {
  // Verify access
  const [existing] = await db
    .select()
    .from(schema.piiRules)
    .innerJoin(schema.sources, eq(schema.piiRules.sourceId, schema.sources.id))
    .innerJoin(schema.projects, eq(schema.sources.projectId, schema.projects.id))
    .where(
      and(
        eq(schema.piiRules.id, ruleId),
        eq(schema.projects.organisationId, organisationId)
      )
    )
    .limit(1);

  if (!existing) {
    throw new NotFoundError('PII Rule');
  }

  await db.delete(schema.piiRules).where(eq(schema.piiRules.id, ruleId));
}

export async function previewPii(sourceId: number, organisationId: number, limit: number) {
  // Verify access and get rules
  const rules = await getPiiRules(sourceId, organisationId);

  // In a real implementation, this would apply PII rules to sample data
  return {
    original: [],
    processed: [],
    rules: rules.length,
  };
}

// PII handling functions
export function maskValue(value: string, piiType: string): string {
  if (!value) return value;

  switch (piiType) {
    case 'email':
      const [localPart, domain] = value.split('@');
      return `${localPart[0]}***@${domain}`;
    case 'phone':
      return value.replace(/\d(?=\d{4})/g, '*');
    case 'name':
      return value.split(' ').map(part => `${part[0]}***`).join(' ');
    default:
      return '*'.repeat(value.length);
  }
}

export function redactValue(_value: string, piiType: string): string {
  switch (piiType) {
    case 'email':
      return '[EMAIL REDACTED]';
    case 'phone':
      return '[PHONE REDACTED]';
    case 'name':
      return '[NAME REDACTED]';
    case 'address':
      return '[ADDRESS REDACTED]';
    default:
      return '[REDACTED]';
  }
}

export function hashValue(value: string): string {
  // In production, use a proper hashing algorithm
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(value).digest('hex').substring(0, 16);
}
