/**
 * Database schema definitions using Drizzle ORM.
 * Per Data Model specification: 13 entities with all indexes and relations.
 */

import { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
}));

// Organisations table
export const organisations = pgTable('organisations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Organisation members junction table
export const organisationMembers = pgTable('organisation_members', {
  id: serial('id').primaryKey(),
  organisationId: integer('organisation_id').notNull().references(() => organisations.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).notNull().default('member'), // 'admin' or 'member'
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueMember: uniqueIndex('org_member_unique').on(table.organisationId, table.userId),
  orgIdx: index('org_members_org_idx').on(table.organisationId),
  userIdx: index('org_members_user_idx').on(table.userId),
}));

// Invitations table
export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  organisationId: integer('organisation_id').notNull().references(() => organisations.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  role: varchar('role', { length: 50 }).notNull().default('member'),
  invitedById: integer('invited_by_id').notNull().references(() => users.id),
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tokenIdx: uniqueIndex('invitations_token_idx').on(table.token),
  emailOrgIdx: index('invitations_email_org_idx').on(table.email, table.organisationId),
}));

// Password reset tokens table
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('password_reset_user_idx').on(table.userId),
}));

// Projects table
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  organisationId: integer('organisation_id').notNull().references(() => organisations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  targetSchema: varchar('target_schema', { length: 100 }), // 'qa_pairs', 'instruction', 'chat', 'structured', 'custom'
  status: varchar('status', { length: 50 }).notNull().default('draft'), // 'draft', 'configured', 'processing', 'completed'
  createdById: integer('created_by_id').notNull().references(() => users.id),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgNameIdx: uniqueIndex('projects_org_name_idx').on(table.organisationId, table.name),
  orgIdx: index('projects_org_idx').on(table.organisationId),
  statusIdx: index('projects_status_idx').on(table.status),
}));

// Sources table
export const sources = pgTable('sources', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'file' or 'api'
  status: varchar('status', { length: 50 }).notNull().default('pending'), // 'pending', 'processing', 'ready', 'error'
  // File source fields
  fileName: varchar('file_name', { length: 255 }),
  fileType: varchar('file_type', { length: 50 }), // 'csv', 'xlsx', 'json'
  fileSize: integer('file_size'),
  filePath: text('file_path'),
  // API source fields
  connectorType: varchar('connector_type', { length: 50 }), // 'teamwork', 'gohighlevel'
  connectorConfig: jsonb('connector_config'), // Encrypted credentials and settings
  // Common fields
  recordCount: integer('record_count'),
  errorMessage: text('error_message'),
  lastSyncAt: timestamp('last_sync_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  projectIdx: index('sources_project_idx').on(table.projectId),
  statusIdx: index('sources_status_idx').on(table.status),
}));

// Source fields table - detected fields from sources
export const sourceFields = pgTable('source_fields', {
  id: serial('id').primaryKey(),
  sourceId: integer('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  path: text('path').notNull(), // JSONPath or column name
  dataType: varchar('data_type', { length: 50 }).notNull(), // 'string', 'number', 'boolean', 'date', 'array', 'object'
  sampleValues: jsonb('sample_values'), // Array of sample values for preview
  nullCount: integer('null_count').default(0),
  uniqueCount: integer('unique_count'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  sourceIdx: index('source_fields_source_idx').on(table.sourceId),
}));

// Field mappings table
export const fieldMappings = pgTable('field_mappings', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  sourceFieldId: integer('source_field_id').notNull().references(() => sourceFields.id, { onDelete: 'cascade' }),
  targetField: varchar('target_field', { length: 255 }).notNull(), // Target schema field name
  transformation: jsonb('transformation'), // Transformation rules (concatenate, template, etc.)
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  projectIdx: index('field_mappings_project_idx').on(table.projectId),
  sourceFieldIdx: index('field_mappings_source_field_idx').on(table.sourceFieldId),
}));

// PII rules table
export const piiRules = pgTable('pii_rules', {
  id: serial('id').primaryKey(),
  sourceId: integer('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  sourceFieldId: integer('source_field_id').notNull().references(() => sourceFields.id, { onDelete: 'cascade' }),
  piiType: varchar('pii_type', { length: 50 }).notNull(), // 'email', 'phone', 'name', 'address', 'ssn', 'credit_card', 'custom'
  handling: varchar('handling', { length: 50 }).notNull(), // 'mask', 'redact', 'hash', 'keep'
  confidence: integer('confidence').notNull().default(100), // Detection confidence 0-100
  isAutoDetected: boolean('is_auto_detected').notNull().default(true),
  customPattern: text('custom_pattern'), // Regex for custom PII types
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  sourceIdx: index('pii_rules_source_idx').on(table.sourceId),
  sourceFieldIdx: index('pii_rules_source_field_idx').on(table.sourceFieldId),
}));

// Processing runs table
export const processingRuns = pgTable('processing_runs', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // 'pending', 'processing', 'completed', 'failed', 'cancelled'
  configSnapshot: jsonb('config_snapshot').notNull(), // Snapshot of all config at run time
  totalRecords: integer('total_records').default(0),
  processedRecords: integer('processed_records').default(0),
  filteredRecords: integer('filtered_records').default(0),
  errorRecords: integer('error_records').default(0),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  errorMessage: text('error_message'),
  createdById: integer('created_by_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  projectIdx: index('processing_runs_project_idx').on(table.projectId),
  statusIdx: index('processing_runs_status_idx').on(table.status),
}));

// Processing stages table - for tracking individual pipeline stages
export const processingStages = pgTable('processing_stages', {
  id: serial('id').primaryKey(),
  runId: integer('run_id').notNull().references(() => processingRuns.id, { onDelete: 'cascade' }),
  stage: varchar('stage', { length: 50 }).notNull(), // 'extraction', 'pii_detection', 'mapping', 'quality_filter', 'export'
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  inputCount: integer('input_count').default(0),
  outputCount: integer('output_count').default(0),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  errorMessage: text('error_message'),
}, (table) => ({
  runIdx: index('processing_stages_run_idx').on(table.runId),
}));

// Exports table
export const exports = pgTable('exports', {
  id: serial('id').primaryKey(),
  runId: integer('run_id').notNull().references(() => processingRuns.id, { onDelete: 'cascade' }),
  format: varchar('format', { length: 50 }).notNull(), // 'jsonl', 'csv', 'parquet'
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size'),
  recordCount: integer('record_count'),
  downloadCount: integer('download_count').default(0),
  expiresAt: timestamp('expires_at'),
  createdById: integer('created_by_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  runIdx: index('exports_run_idx').on(table.runId),
}));

// Audit events table
export const auditEvents = pgTable('audit_events', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id),
  eventType: varchar('event_type', { length: 100 }).notNull(), // 'project.created', 'source.uploaded', 'processing.started', etc.
  eventData: jsonb('event_data'), // Additional event-specific data
  resourceType: varchar('resource_type', { length: 50 }), // 'project', 'source', 'export', etc.
  resourceId: integer('resource_id'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  projectIdx: index('audit_events_project_idx').on(table.projectId),
  userIdx: index('audit_events_user_idx').on(table.userId),
  eventTypeIdx: index('audit_events_type_idx').on(table.eventType),
  createdAtIdx: index('audit_events_created_at_idx').on(table.createdAt),
}));

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  organisationMembers: many(organisationMembers),
  invitationsSent: many(invitations),
  projectsCreated: many(projects),
  processingRuns: many(processingRuns),
  exports: many(exports),
  auditEvents: many(auditEvents),
}));

export const organisationsRelations = relations(organisations, ({ many }) => ({
  members: many(organisationMembers),
  invitations: many(invitations),
  projects: many(projects),
}));

export const organisationMembersRelations = relations(organisationMembers, ({ one }) => ({
  organisation: one(organisations, {
    fields: [organisationMembers.organisationId],
    references: [organisations.id],
  }),
  user: one(users, {
    fields: [organisationMembers.userId],
    references: [users.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  organisation: one(organisations, {
    fields: [invitations.organisationId],
    references: [organisations.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedById],
    references: [users.id],
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [projects.organisationId],
    references: [organisations.id],
  }),
  createdBy: one(users, {
    fields: [projects.createdById],
    references: [users.id],
  }),
  sources: many(sources),
  fieldMappings: many(fieldMappings),
  processingRuns: many(processingRuns),
  auditEvents: many(auditEvents),
}));

export const sourcesRelations = relations(sources, ({ one, many }) => ({
  project: one(projects, {
    fields: [sources.projectId],
    references: [projects.id],
  }),
  fields: many(sourceFields),
  piiRules: many(piiRules),
}));

export const sourceFieldsRelations = relations(sourceFields, ({ one, many }) => ({
  source: one(sources, {
    fields: [sourceFields.sourceId],
    references: [sources.id],
  }),
  mappings: many(fieldMappings),
  piiRules: many(piiRules),
}));

export const fieldMappingsRelations = relations(fieldMappings, ({ one }) => ({
  project: one(projects, {
    fields: [fieldMappings.projectId],
    references: [projects.id],
  }),
  sourceField: one(sourceFields, {
    fields: [fieldMappings.sourceFieldId],
    references: [sourceFields.id],
  }),
}));

export const piiRulesRelations = relations(piiRules, ({ one }) => ({
  source: one(sources, {
    fields: [piiRules.sourceId],
    references: [sources.id],
  }),
  sourceField: one(sourceFields, {
    fields: [piiRules.sourceFieldId],
    references: [sourceFields.id],
  }),
}));

export const processingRunsRelations = relations(processingRuns, ({ one, many }) => ({
  project: one(projects, {
    fields: [processingRuns.projectId],
    references: [projects.id],
  }),
  createdBy: one(users, {
    fields: [processingRuns.createdById],
    references: [users.id],
  }),
  stages: many(processingStages),
  exports: many(exports),
}));

export const processingStagesRelations = relations(processingStages, ({ one }) => ({
  run: one(processingRuns, {
    fields: [processingStages.runId],
    references: [processingRuns.id],
  }),
}));

export const exportsRelations = relations(exports, ({ one }) => ({
  run: one(processingRuns, {
    fields: [exports.runId],
    references: [processingRuns.id],
  }),
  createdBy: one(users, {
    fields: [exports.createdById],
    references: [users.id],
  }),
}));

export const auditEventsRelations = relations(auditEvents, ({ one }) => ({
  project: one(projects, {
    fields: [auditEvents.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [auditEvents.userId],
    references: [users.id],
  }),
}));
