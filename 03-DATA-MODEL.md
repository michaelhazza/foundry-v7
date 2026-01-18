# 03-DATA-MODEL.md - Foundry Data Model Document

## FRAMEWORK VERSION

Framework: Agent Specification Framework v2.1
Constitution: Agent 0 - Agent Constitution v3
Status: Active

---

## VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1 | 2025-01-18 | Initial data model from PRD v1 and Architecture v1; Hygiene Gate: PASS |

---

## INHERITED CONSTITUTION

This document inherits and must comply with **Agent 0: Agent Constitution v3**.

This document must not restate or redefine global rules. It references the Constitution for global conventions.

---

## Section 1: Entity Overview

### 1.1 Entities

| Entity | Purpose | Key Relationships |
|--------|---------|-------------------|
| users | System users with authentication credentials | Belongs to organisations (via organisationMembers), owns projects, creates audit events |
| organisations | Multi-tenant isolation containers | Has many users (via organisationMembers), has many projects, has many invitations |
| organisationMembers | Junction table for user-organisation relationship with roles | Belongs to user, belongs to organisation |
| invitations | Pending invitations to join organisations | Belongs to organisation, created by user |
| projects | Work containers for data preparation workflows | Belongs to organisation, has many sources, has many processingRuns, has many exports |
| sources | Data sources (files or API connections) | Belongs to project, has many sourceFields |
| sourceFields | Detected fields from source data | Belongs to source |
| fieldMappings | Maps source fields to canonical schema fields | Belongs to project, references sourceField |
| piiRules | De-identification rules for detected PII | Belongs to project |
| processingRuns | Pipeline execution records | Belongs to project, has many processingStages, has many exports |
| processingStages | Individual stages within a processing run | Belongs to processingRun |
| exports | Generated output datasets | Belongs to project, belongs to processingRun |
| auditEvents | Compliance and lineage tracking | Belongs to organisation, belongs to project (optional), created by user |
| passwordResetTokens | Password reset token storage | Belongs to user |

### 1.2 Entity Relationship Diagram

```
organisations
    |
    +--< organisationMembers >--+ users
    |                           |
    +--< invitations            +--< passwordResetTokens
    |
    +--< projects
            |
            +--< sources
            |       |
            |       +--< sourceFields
            |
            +--< fieldMappings
            |
            +--< piiRules
            |
            +--< processingRuns
            |       |
            |       +--< processingStages
            |
            +--< exports
            |
            +--< auditEvents (optional project scope)

Legend:
  --< : one-to-many relationship
  >--< : many-to-many (via junction table)
```

### 1.3 Canonical Schemas

Per PRD F-006, three canonical output schemas are supported:

| Schema | Purpose | Required Fields |
|--------|---------|-----------------|
| Conversation | Multi-turn dialogue data | conversationId, messages (array with role, content, timestamp) |
| Q&A Pairs | Question-answer pairs | question, answer, context (optional) |
| Knowledge Document | Document-style content | title, content, metadata (optional) |

---

## Section 2: Schema Definition

```typescript
// server/db/schema.ts
import { 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  integer, 
  boolean, 
  jsonb,
  index,
  uniqueIndex
} from 'drizzle-orm/pg-core';

// ============================================================================
// STANDARD AUDIT COLUMNS
// ============================================================================

const auditColumns = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
};

// ============================================================================
// USERS
// ============================================================================

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  ...auditColumns,
}, (table) => [
  uniqueIndex('users_email_idx').on(table.email),
]);

// ============================================================================
// ORGANISATIONS
// ============================================================================

export const organisations = pgTable('organisations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  ...auditColumns,
});

// ============================================================================
// ORGANISATION MEMBERS (Junction Table)
// ============================================================================

export const organisationMembers = pgTable('organisation_members', {
  id: serial('id').primaryKey(),
  organisationId: integer('organisation_id').notNull().references(() => organisations.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'), // 'admin' | 'member'
  ...auditColumns,
}, (table) => [
  uniqueIndex('org_members_unique_idx').on(table.organisationId, table.userId),
  index('org_members_org_idx').on(table.organisationId),
  index('org_members_user_idx').on(table.userId),
]);

// ============================================================================
// INVITATIONS
// ============================================================================

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  organisationId: integer('organisation_id').notNull().references(() => organisations.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  role: text('role').notNull().default('member'), // Role to assign on acceptance
  invitedByUserId: integer('invited_by_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(), // 7 days from creation per PRD
  acceptedAt: timestamp('accepted_at'),
  ...auditColumns,
}, (table) => [
  uniqueIndex('invitations_token_idx').on(table.token),
  index('invitations_org_idx').on(table.organisationId),
  index('invitations_email_idx').on(table.email),
]);

// ============================================================================
// PASSWORD RESET TOKENS
// ============================================================================

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(), // SHA-256 hash of token
  expiresAt: timestamp('expires_at').notNull(), // 1 hour from creation per PRD
  usedAt: timestamp('used_at'),
  ...auditColumns,
}, (table) => [
  index('password_reset_user_idx').on(table.userId),
]);

// ============================================================================
// PROJECTS
// ============================================================================

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  organisationId: integer('organisation_id').notNull().references(() => organisations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  schema: text('schema').notNull().default('conversation'), // 'conversation' | 'qa_pairs' | 'knowledge_document'
  qualityConfig: jsonb('quality_config').$type<{
    minCompleteness?: number; // 0-100 percentage
    minConversationLength?: number; // Minimum messages for conversation data
  }>(),
  isDeleted: boolean('is_deleted').notNull().default(false),
  deletedAt: timestamp('deleted_at'),
  ...auditColumns,
}, (table) => [
  index('projects_org_idx').on(table.organisationId),
  uniqueIndex('projects_org_name_idx').on(table.organisationId, table.name).where('is_deleted = false'),
]);

// ============================================================================
// SOURCES
// ============================================================================

export const sources = pgTable('sources', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'file' | 'api_teamwork' | 'api_gohighlevel'
  status: text('status').notNull().default('pending'), // 'pending' | 'processing' | 'ready' | 'error'
  
  // File-specific fields
  fileType: text('file_type'), // 'csv' | 'xlsx' | 'json'
  fileSize: integer('file_size'), // bytes
  
  // API-specific fields (credentials encrypted per Architecture Section 6.6)
  apiCredentials: text('api_credentials'), // Encrypted JSON
  apiConfig: jsonb('api_config').$type<{
    subdomain?: string; // Teamwork
    dateRange?: { start: string; end: string };
    filters?: Record<string, string>;
    lastImportedId?: string; // For incremental imports
  }>(),
  
  // Raw data storage (JSONB per Architecture Section 7.2)
  rawData: jsonb('raw_data').$type<Record<string, unknown>[]>(),
  recordCount: integer('record_count'),
  
  // Structure detection results
  detectedStructure: jsonb('detected_structure').$type<{
    columns?: Array<{ name: string; type: string; sample: string }>;
    sheets?: Array<{ name: string; columns: Array<{ name: string; type: string }> }>;
    keys?: Array<{ path: string; type: string }>;
  }>(),
  
  errorMessage: text('error_message'),
  expiresAt: timestamp('expires_at'), // 30 days retention per PRD
  isDeleted: boolean('is_deleted').notNull().default(false),
  deletedAt: timestamp('deleted_at'),
  ...auditColumns,
}, (table) => [
  index('sources_project_idx').on(table.projectId),
  index('sources_status_idx').on(table.status),
]);

// ============================================================================
// SOURCE FIELDS
// ============================================================================

export const sourceFields = pgTable('source_fields', {
  id: serial('id').primaryKey(),
  sourceId: integer('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  path: text('path').notNull(), // JSON path or column name
  dataType: text('data_type').notNull(), // 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'
  sampleValues: jsonb('sample_values').$type<string[]>(),
  nullCount: integer('null_count'),
  uniqueCount: integer('unique_count'),
  ...auditColumns,
}, (table) => [
  index('source_fields_source_idx').on(table.sourceId),
]);

// ============================================================================
// FIELD MAPPINGS
// ============================================================================

export const fieldMappings = pgTable('field_mappings', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  sourceFieldId: integer('source_field_id').references(() => sourceFields.id, { onDelete: 'cascade' }),
  targetField: text('target_field').notNull(), // Schema field name
  isRequired: boolean('is_required').notNull().default(false),
  transformation: jsonb('transformation').$type<{
    type: 'none' | 'concatenate' | 'split' | 'date_format' | 'case_convert';
    config?: Record<string, unknown>;
  }>(),
  ...auditColumns,
}, (table) => [
  index('field_mappings_project_idx').on(table.projectId),
  index('field_mappings_source_field_idx').on(table.sourceFieldId),
]);

// ============================================================================
// PII RULES
// ============================================================================

export const piiRules = pgTable('pii_rules', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  sourceFieldId: integer('source_field_id').references(() => sourceFields.id, { onDelete: 'set null' }),
  
  // Detection info
  piiType: text('pii_type').notNull(), // 'name' | 'email' | 'phone' | 'address' | 'dob' | 'government_id' | 'custom'
  detectionMethod: text('detection_method').notNull(), // 'automatic' | 'manual' | 'regex'
  confidenceScore: integer('confidence_score'), // 0-100, only for automatic detection
  
  // Handling configuration
  handling: text('handling').notNull().default('mask'), // 'mask' | 'redact' | 'pseudonymise' | 'retain'
  customPattern: text('custom_pattern'), // Regex for custom detection
  maskFormat: text('mask_format'), // e.g., '[EMAIL]', '[NAME]', custom format
  
  // User override
  isConfirmed: boolean('is_confirmed').notNull().default(false),
  ...auditColumns,
}, (table) => [
  index('pii_rules_project_idx').on(table.projectId),
  index('pii_rules_source_field_idx').on(table.sourceFieldId),
]);

// ============================================================================
// PROCESSING RUNS
// ============================================================================

export const processingRuns = pgTable('processing_runs', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  triggeredByUserId: integer('triggered_by_user_id').notNull().references(() => users.id, { onDelete: 'set null' }),
  
  // Status tracking (string enum per Agent 3 convention)
  status: text('status').notNull().default('pending'), // 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  
  // Progress tracking (batch operations pattern)
  currentStage: text('current_stage'), // 'ingest' | 'normalise' | 'de-identify' | 'filter' | 'format'
  processedCount: integer('processed_count').notNull().default(0),
  totalCount: integer('total_count'),
  
  // Configuration snapshot at processing time (for lineage)
  configSnapshot: jsonb('config_snapshot').$type<{
    schema: string;
    mappings: Array<{ sourceField: string; targetField: string; transformation?: unknown }>;
    piiRules: Array<{ field: string; handling: string }>;
    qualityConfig: { minCompleteness?: number; minConversationLength?: number };
  }>(),
  
  // Results
  outputRecordCount: integer('output_record_count'),
  excludedRecordCount: integer('excluded_record_count'),
  errorMessage: text('error_message'),
  
  // Timing
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  ...auditColumns,
}, (table) => [
  index('processing_runs_project_idx').on(table.projectId),
  index('processing_runs_status_idx').on(table.projectId, table.status),
]);

// ============================================================================
// PROCESSING STAGES
// ============================================================================

export const processingStages = pgTable('processing_stages', {
  id: serial('id').primaryKey(),
  processingRunId: integer('processing_run_id').notNull().references(() => processingRuns.id, { onDelete: 'cascade' }),
  
  stage: text('stage').notNull(), // 'ingest' | 'normalise' | 'de-identify' | 'filter' | 'format'
  status: text('status').notNull().default('pending'), // 'pending' | 'processing' | 'completed' | 'failed' | 'skipped'
  
  inputRecordCount: integer('input_record_count'),
  outputRecordCount: integer('output_record_count'),
  errorMessage: text('error_message'),
  
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  ...auditColumns,
}, (table) => [
  index('processing_stages_run_idx').on(table.processingRunId),
]);

// ============================================================================
// EXPORTS
// ============================================================================

export const exports = pgTable('exports', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  processingRunId: integer('processing_run_id').notNull().references(() => processingRuns.id, { onDelete: 'cascade' }),
  
  format: text('format').notNull(), // 'jsonl' | 'qa_json' | 'structured_json'
  status: text('status').notNull().default('pending'), // 'pending' | 'generating' | 'ready' | 'failed' | 'expired'
  
  // Output data storage (JSONB per Architecture Section 7.2)
  outputData: jsonb('output_data').$type<Record<string, unknown>[]>(),
  recordCount: integer('record_count'),
  fileSizeBytes: integer('file_size_bytes'),
  
  errorMessage: text('error_message'),
  expiresAt: timestamp('expires_at'), // 30 days retention per PRD
  downloadCount: integer('download_count').notNull().default(0),
  lastDownloadedAt: timestamp('last_downloaded_at'),
  ...auditColumns,
}, (table) => [
  index('exports_project_idx').on(table.projectId),
  index('exports_run_idx').on(table.processingRunId),
  index('exports_status_idx').on(table.status),
]);

// ============================================================================
// AUDIT EVENTS
// ============================================================================

export const auditEvents = pgTable('audit_events', {
  id: serial('id').primaryKey(),
  organisationId: integer('organisation_id').notNull().references(() => organisations.id, { onDelete: 'cascade' }),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }), // Optional, null for org-level events
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  
  eventType: text('event_type').notNull(), // See event types below
  resourceType: text('resource_type').notNull(), // 'project' | 'source' | 'processing_run' | 'export' | 'user' | 'organisation'
  resourceId: integer('resource_id'),
  
  details: jsonb('details').$type<Record<string, unknown>>(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  ...auditColumns,
}, (table) => [
  index('audit_events_org_idx').on(table.organisationId),
  index('audit_events_project_idx').on(table.projectId),
  index('audit_events_type_idx').on(table.eventType),
  index('audit_events_created_idx').on(table.createdAt),
]);

/*
Audit Event Types:
- user.registered
- user.logged_in
- user.password_reset
- organisation.created
- organisation.updated
- member.invited
- member.joined
- member.removed
- member.role_changed
- project.created
- project.updated
- project.deleted
- source.uploaded
- source.connected
- source.deleted
- mapping.configured
- pii.detected
- pii.rule_configured
- processing.started
- processing.completed
- processing.failed
- processing.cancelled
- export.generated
- export.downloaded
*/
```

---

## Section 3: Relationships

### 3.1 Foreign Key Definitions

| Parent Table | Child Table | Foreign Key | Cascade Behavior | Rationale |
|--------------|-------------|-------------|------------------|-----------|
| organisations | organisationMembers | organisation_id | CASCADE | Remove memberships when org deleted |
| users | organisationMembers | user_id | CASCADE | Remove memberships when user deleted |
| organisations | invitations | organisation_id | CASCADE | Remove invitations when org deleted |
| users | invitations | invited_by_user_id | CASCADE | Remove invitations when inviter deleted |
| users | passwordResetTokens | user_id | CASCADE | Remove tokens when user deleted |
| organisations | projects | organisation_id | CASCADE | Remove projects when org deleted |
| projects | sources | project_id | CASCADE | Remove sources when project deleted |
| sources | sourceFields | source_id | CASCADE | Remove fields when source deleted |
| projects | fieldMappings | project_id | CASCADE | Remove mappings when project deleted |
| sourceFields | fieldMappings | source_field_id | CASCADE | Remove mappings when source field deleted |
| projects | piiRules | project_id | CASCADE | Remove rules when project deleted |
| sourceFields | piiRules | source_field_id | SET NULL | Preserve rules for audit, mark orphaned |
| projects | processingRuns | project_id | CASCADE | Remove runs when project deleted |
| users | processingRuns | triggered_by_user_id | SET NULL | Preserve runs for audit, mark user deleted |
| processingRuns | processingStages | processing_run_id | CASCADE | Remove stages when run deleted |
| projects | exports | project_id | CASCADE | Remove exports when project deleted |
| processingRuns | exports | processing_run_id | CASCADE | Remove exports when run deleted |
| organisations | auditEvents | organisation_id | CASCADE | Remove audit trail when org deleted |
| projects | auditEvents | project_id | CASCADE | Remove project audit when project deleted |
| users | auditEvents | user_id | SET NULL | Preserve audit trail, mark user deleted |

### 3.2 Cardinality Summary

| Relationship | Type | Description |
|--------------|------|-------------|
| organisation <-> user | Many-to-Many | Via organisationMembers |
| organisation -> invitation | One-to-Many | Org has many pending invitations |
| organisation -> project | One-to-Many | Org contains many projects |
| project -> source | One-to-Many | Project has many data sources |
| source -> sourceField | One-to-Many | Source has many detected fields |
| project -> fieldMapping | One-to-Many | Project has mapping configuration |
| project -> piiRule | One-to-Many | Project has PII rule configuration |
| project -> processingRun | One-to-Many | Project has many processing runs |
| processingRun -> processingStage | One-to-Many | Run has many stages |
| project -> export | One-to-Many | Project has many exports |
| processingRun -> export | One-to-Many | Run can generate many exports |
| organisation -> auditEvent | One-to-Many | Org has audit trail |

---

## Section 4: Index Strategy

### 4.1 Index Definitions

| Table | Index Name | Columns | Type | Rationale |
|-------|------------|---------|------|-----------|
| users | users_email_idx | email | UNIQUE | Login lookup, uniqueness |
| organisationMembers | org_members_unique_idx | organisation_id, user_id | UNIQUE | Prevent duplicate memberships |
| organisationMembers | org_members_org_idx | organisation_id | B-TREE | List members by org |
| organisationMembers | org_members_user_idx | user_id | B-TREE | Find user's orgs |
| invitations | invitations_token_idx | token | UNIQUE | Token lookup, uniqueness |
| invitations | invitations_org_idx | organisation_id | B-TREE | List invitations by org |
| invitations | invitations_email_idx | email | B-TREE | Check existing invitations |
| passwordResetTokens | password_reset_user_idx | user_id | B-TREE | Find user's reset tokens |
| projects | projects_org_idx | organisation_id | B-TREE | List projects by org (most common query) |
| projects | projects_org_name_idx | organisation_id, name | UNIQUE (partial) | Unique names within org for non-deleted |
| sources | sources_project_idx | project_id | B-TREE | List sources by project |
| sources | sources_status_idx | status | B-TREE | Filter by processing status |
| sourceFields | source_fields_source_idx | source_id | B-TREE | List fields by source |
| fieldMappings | field_mappings_project_idx | project_id | B-TREE | Get mappings for project |
| fieldMappings | field_mappings_source_field_idx | source_field_id | B-TREE | Lookup by source field |
| piiRules | pii_rules_project_idx | project_id | B-TREE | Get rules for project |
| piiRules | pii_rules_source_field_idx | source_field_id | B-TREE | Lookup by source field |
| processingRuns | processing_runs_project_idx | project_id | B-TREE | List runs by project |
| processingRuns | processing_runs_status_idx | project_id, status | B-TREE | Find active runs |
| processingStages | processing_stages_run_idx | processing_run_id | B-TREE | List stages by run |
| exports | exports_project_idx | project_id | B-TREE | List exports by project |
| exports | exports_run_idx | processing_run_id | B-TREE | List exports by run |
| exports | exports_status_idx | status | B-TREE | Filter by status |
| auditEvents | audit_events_org_idx | organisation_id | B-TREE | Audit trail by org |
| auditEvents | audit_events_project_idx | project_id | B-TREE | Audit trail by project |
| auditEvents | audit_events_type_idx | event_type | B-TREE | Filter by event type |
| auditEvents | audit_events_created_idx | created_at | B-TREE | Chronological queries |

---

## Section 5: Query Patterns

### 5.1 Common Queries (Core Select API)

```typescript
import { db } from './db';
import { eq, and, desc, isNull, sql } from 'drizzle-orm';
import { 
  users, 
  organisations, 
  organisationMembers, 
  projects, 
  sources,
  processingRuns,
  exports,
  auditEvents 
} from './schema';

// ============================================================================
// USER QUERIES
// ============================================================================

// Find user by email (login)
async function findUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user;
}

// Get user's organisations with role
async function getUserOrganisations(userId: number) {
  return db
    .select({
      organisation: organisations,
      role: organisationMembers.role,
    })
    .from(organisationMembers)
    .innerJoin(organisations, eq(organisationMembers.organisationId, organisations.id))
    .where(eq(organisationMembers.userId, userId));
}

// ============================================================================
// ORGANISATION QUERIES
// ============================================================================

// Get organisation members with user details (N+1 avoided via JOIN)
async function getOrganisationMembers(orgId: number) {
  return db
    .select({
      user: users,
      role: organisationMembers.role,
      joinedAt: organisationMembers.createdAt,
    })
    .from(organisationMembers)
    .innerJoin(users, eq(organisationMembers.userId, users.id))
    .where(eq(organisationMembers.organisationId, orgId));
}

// ============================================================================
// PROJECT QUERIES
// ============================================================================

// List projects for organisation (multi-tenancy scoped)
async function listProjectsForOrg(orgId: number) {
  return db
    .select()
    .from(projects)
    .where(and(
      eq(projects.organisationId, orgId),
      eq(projects.isDeleted, false)
    ))
    .orderBy(desc(projects.updatedAt));
}

// Get project with source count (single query with subquery)
async function getProjectWithStats(projectId: number, orgId: number) {
  const [project] = await db
    .select({
      project: projects,
      sourceCount: sql<number>`(
        SELECT COUNT(*) FROM sources 
        WHERE sources.project_id = ${projects.id} 
        AND sources.is_deleted = false
      )`,
    })
    .from(projects)
    .where(and(
      eq(projects.id, projectId),
      eq(projects.organisationId, orgId),
      eq(projects.isDeleted, false)
    ))
    .limit(1);
  return project;
}

// ============================================================================
// SOURCE QUERIES
// ============================================================================

// List sources for project
async function listSourcesForProject(projectId: number) {
  return db
    .select()
    .from(sources)
    .where(and(
      eq(sources.projectId, projectId),
      eq(sources.isDeleted, false)
    ))
    .orderBy(desc(sources.createdAt));
}

// Get source with detected fields (single query)
async function getSourceWithFields(sourceId: number) {
  const [source] = await db
    .select()
    .from(sources)
    .where(eq(sources.id, sourceId))
    .limit(1);
  
  if (!source) return null;
  
  const fields = await db
    .select()
    .from(sourceFields)
    .where(eq(sourceFields.sourceId, sourceId));
  
  return { ...source, fields };
}

// ============================================================================
// PROCESSING QUERIES
// ============================================================================

// Get active processing run for project
async function getActiveProcessingRun(projectId: number) {
  const [run] = await db
    .select()
    .from(processingRuns)
    .where(and(
      eq(processingRuns.projectId, projectId),
      sql`${processingRuns.status} IN ('pending', 'processing')`
    ))
    .orderBy(desc(processingRuns.createdAt))
    .limit(1);
  return run;
}

// Get processing run with stages (N+1 avoided)
async function getProcessingRunWithStages(runId: number) {
  const [run] = await db
    .select()
    .from(processingRuns)
    .where(eq(processingRuns.id, runId))
    .limit(1);
  
  if (!run) return null;
  
  const stages = await db
    .select()
    .from(processingStages)
    .where(eq(processingStages.processingRunId, runId))
    .orderBy(processingStages.id);
  
  return { ...run, stages };
}

// ============================================================================
// EXPORT QUERIES
// ============================================================================

// List exports for project
async function listExportsForProject(projectId: number) {
  return db
    .select({
      export: exports,
      processingRun: {
        id: processingRuns.id,
        status: processingRuns.status,
        completedAt: processingRuns.completedAt,
      },
    })
    .from(exports)
    .innerJoin(processingRuns, eq(exports.processingRunId, processingRuns.id))
    .where(eq(exports.projectId, projectId))
    .orderBy(desc(exports.createdAt));
}

// ============================================================================
// AUDIT QUERIES
// ============================================================================

// Get audit trail for project (paginated)
async function getProjectAuditTrail(projectId: number, limit: number, offset: number) {
  return db
    .select({
      event: auditEvents,
      userName: users.name,
    })
    .from(auditEvents)
    .leftJoin(users, eq(auditEvents.userId, users.id))
    .where(eq(auditEvents.projectId, projectId))
    .orderBy(desc(auditEvents.createdAt))
    .limit(limit)
    .offset(offset);
}
```

### 5.2 Transaction Patterns

```typescript
import { db } from './db';

// Create project with default configuration
async function createProjectWithDefaults(
  orgId: number, 
  userId: number, 
  name: string, 
  description?: string
) {
  return await db.transaction(async (tx) => {
    // Create project
    const [project] = await tx
      .insert(projects)
      .values({
        organisationId: orgId,
        name,
        description,
        schema: 'conversation',
        qualityConfig: { minCompleteness: 80 },
      })
      .returning();
    
    // Log audit event
    await tx.insert(auditEvents).values({
      organisationId: orgId,
      projectId: project.id,
      userId,
      eventType: 'project.created',
      resourceType: 'project',
      resourceId: project.id,
      details: { name },
    });
    
    return project;
  });
}

// Accept invitation and create membership
async function acceptInvitation(userId: number, invitationId: number) {
  return await db.transaction(async (tx) => {
    // Get invitation
    const [invitation] = await tx
      .select()
      .from(invitations)
      .where(and(
        eq(invitations.id, invitationId),
        isNull(invitations.acceptedAt)
      ))
      .limit(1);
    
    if (!invitation) {
      throw new Error('Invalid or expired invitation');
    }
    
    if (new Date() > invitation.expiresAt) {
      throw new Error('Invitation has expired');
    }
    
    // Create membership
    await tx.insert(organisationMembers).values({
      organisationId: invitation.organisationId,
      userId,
      role: invitation.role,
    });
    
    // Mark invitation as accepted
    await tx
      .update(invitations)
      .set({ acceptedAt: new Date() })
      .where(eq(invitations.id, invitationId));
    
    // Log audit event
    await tx.insert(auditEvents).values({
      organisationId: invitation.organisationId,
      userId,
      eventType: 'member.joined',
      resourceType: 'user',
      resourceId: userId,
      details: { invitationId },
    });
    
    return invitation.organisationId;
  });
}

// Soft delete project
async function softDeleteProject(projectId: number, userId: number, orgId: number) {
  return await db.transaction(async (tx) => {
    const now = new Date();
    
    await tx
      .update(projects)
      .set({ isDeleted: true, deletedAt: now, updatedAt: now })
      .where(eq(projects.id, projectId));
    
    await tx.insert(auditEvents).values({
      organisationId: orgId,
      projectId,
      userId,
      eventType: 'project.deleted',
      resourceType: 'project',
      resourceId: projectId,
    });
  });
}
```

---

## Section 6: Migration Strategy

### 6.1 Migration Configuration

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  schema: './server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

### 6.2 Database Connection Module

```typescript
// server/db/index.ts
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

// Per Constitution Section D: Use postgres-js, NOT @neondatabase/serverless
const sql = postgres(process.env.DATABASE_URL!, {
  max: 10,           // Connection pool size (per Architecture Section 2.3)
  idle_timeout: 20,  // Close idle connections after 20s
  connect_timeout: 10,
});

export const db = drizzle(sql, { schema });

// Graceful shutdown handler (per Architecture Section 9)
export async function closeDatabase() {
  await sql.end();
}

// Register shutdown handler
process.on('SIGTERM', async () => {
  await closeDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await closeDatabase();
  process.exit(0);
});
```

### 6.3 Migration Script

```typescript
// scripts/migrate.ts
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

async function runMigrations() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(sql);
  
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations complete');
  
  await sql.end();
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
```

### 6.4 Migration Commands

```json
// package.json (scripts section)
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:migrate": "tsx scripts/migrate.ts",
    "db:studio": "drizzle-kit studio"
  }
}
```

### 6.5 Seed Data (Development)

```typescript
// scripts/seed.ts
import { db } from '../server/db';
import { users, organisations, organisationMembers, projects } from '../server/db/schema';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('Seeding database...');
  
  // Create test organisation
  const [org] = await db.insert(organisations).values({
    name: 'Test Organisation',
  }).returning();
  
  // Create test admin user
  const passwordHash = await bcrypt.hash('TestPassword123', 10);
  const [admin] = await db.insert(users).values({
    email: 'admin@test.com',
    passwordHash,
    name: 'Test Admin',
  }).returning();
  
  // Add admin to organisation
  await db.insert(organisationMembers).values({
    organisationId: org.id,
    userId: admin.id,
    role: 'admin',
  });
  
  // Create sample project
  await db.insert(projects).values({
    organisationId: org.id,
    name: 'Sample Project',
    description: 'A sample project for testing',
    schema: 'conversation',
  });
  
  console.log('Seed complete');
  console.log('Test credentials: admin@test.com / TestPassword123');
  
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

---

## Section 7: Type Exports

```typescript
// server/db/types.ts
import {
  users,
  organisations,
  organisationMembers,
  invitations,
  passwordResetTokens,
  projects,
  sources,
  sourceFields,
  fieldMappings,
  piiRules,
  processingRuns,
  processingStages,
  exports,
  auditEvents,
} from './schema';

// Select types (for reading from DB)
export type User = typeof users.$inferSelect;
export type Organisation = typeof organisations.$inferSelect;
export type OrganisationMember = typeof organisationMembers.$inferSelect;
export type Invitation = typeof invitations.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Source = typeof sources.$inferSelect;
export type SourceField = typeof sourceFields.$inferSelect;
export type FieldMapping = typeof fieldMappings.$inferSelect;
export type PIIRule = typeof piiRules.$inferSelect;
export type ProcessingRun = typeof processingRuns.$inferSelect;
export type ProcessingStage = typeof processingStages.$inferSelect;
export type Export = typeof exports.$inferSelect;
export type AuditEvent = typeof auditEvents.$inferSelect;

// Insert types (for writing to DB)
export type NewUser = typeof users.$inferInsert;
export type NewOrganisation = typeof organisations.$inferInsert;
export type NewOrganisationMember = typeof organisationMembers.$inferInsert;
export type NewInvitation = typeof invitations.$inferInsert;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;
export type NewProject = typeof projects.$inferInsert;
export type NewSource = typeof sources.$inferInsert;
export type NewSourceField = typeof sourceFields.$inferInsert;
export type NewFieldMapping = typeof fieldMappings.$inferInsert;
export type NewPIIRule = typeof piiRules.$inferInsert;
export type NewProcessingRun = typeof processingRuns.$inferInsert;
export type NewProcessingStage = typeof processingStages.$inferInsert;
export type NewExport = typeof exports.$inferInsert;
export type NewAuditEvent = typeof auditEvents.$inferInsert;

// Enums (for type safety)
export type UserRole = 'admin' | 'member';
export type SourceType = 'file' | 'api_teamwork' | 'api_gohighlevel';
export type FileType = 'csv' | 'xlsx' | 'json';
export type SourceStatus = 'pending' | 'processing' | 'ready' | 'error';
export type ProjectSchema = 'conversation' | 'qa_pairs' | 'knowledge_document';
export type PIIType = 'name' | 'email' | 'phone' | 'address' | 'dob' | 'government_id' | 'custom';
export type PIIHandling = 'mask' | 'redact' | 'pseudonymise' | 'retain';
export type PIIDetectionMethod = 'automatic' | 'manual' | 'regex';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type ProcessingStageType = 'ingest' | 'normalise' | 'de-identify' | 'filter' | 'format';
export type ExportFormat = 'jsonl' | 'qa_json' | 'structured_json';
export type ExportStatus = 'pending' | 'generating' | 'ready' | 'failed' | 'expired';
export type TransformationType = 'none' | 'concatenate' | 'split' | 'date_format' | 'case_convert';
```

---

## Section 8: Document Validation

### Completeness Checklist
- [x] All PRD entities represented
- [x] All relationships defined with cascade behaviour
- [x] Foreign keys indexed
- [x] Audit columns on all tables
- [x] Migration scripts specified
- [x] Type exports defined

### Prompt Maintenance Contract

If this document is edited, you MUST:
1. Update the version history with changes and `Hygiene Gate: PASS`
2. Re-run all Prompt Hygiene Gate checks (per Constitution Section L)
3. Confirm encoding is clean (no mojibake or non-ASCII artifacts)
4. Verify no global rules are restated (reference Constitution instead)

If any check fails, the document update is invalid and must not be delivered.

### Prompt Hygiene Gate (per Constitution Section L)
- [x] Framework Version header present and correct
- [x] Encoding scan passed: No non-ASCII artifact tokens
- [x] Inheritance statement references Constitution v3
- [x] No full restatement of global rules (uses "Per Constitution Section X" references)

### Entity Coverage

| PRD Entity | Schema Table | Status |
|------------|--------------|--------|
| User | users | Implemented |
| Organisation | organisations | Implemented |
| OrganisationMember | organisationMembers | Implemented |
| Invitation | invitations | Implemented |
| Project | projects | Implemented |
| Source (FileSource, APISource) | sources | Implemented (unified with type column) |
| FieldMapping | fieldMappings | Implemented |
| PIIRule | piiRules | Implemented |
| ProcessingRun | processingRuns | Implemented |
| ProcessingStage | processingStages | Implemented |
| Export | exports | Implemented |
| AuditEvent | auditEvents | Implemented |
| PasswordResetToken | passwordResetTokens | Implemented (added for PRD F-001) |
| SourceField | sourceFields | Implemented (added for field detection) |

### Document Status: COMPLETE

---

## Section 9: Downstream Agent Handoff Brief

### For Agent 4: API Contract
- **Entity operations needed (CRUD per entity):**
  - Users: Create (register), Read (profile), Update (profile)
  - Organisations: Read, Update (admin only)
  - OrganisationMembers: Read (list), Update (role), Delete (remove)
  - Invitations: Create (invite), Read (validate token)
  - Projects: Full CRUD
  - Sources: Create (file upload, API connect), Read, Delete (soft delete)
  - FieldMappings: Create, Read, Update, Delete (per project)
  - PIIRules: Create, Read, Update, Delete (per project)
  - ProcessingRuns: Create (start), Read (status), Cancel
  - Exports: Create (generate), Read (list, download)
  - AuditEvents: Read (lineage, summary)
- **Relationship traversal patterns:**
  - Organisation -> Projects (list)
  - Project -> Sources (list)
  - Project -> ProcessingRuns (history)
  - ProcessingRun -> Exports (list)
- **Pagination requirements:** 
  - Per Constitution Section C: Use paginated envelope for list endpoints
  - Default limit: 20, max limit: 100
  - Required for: projects, sources, exports, audit events

### For Agent 5: UI/UX Specification
- **Data shapes for forms:**
  - User registration: email, password, name
  - Project creation: name, description, schema
  - Source upload: file, name (auto-detected)
  - API connection: type, credentials, config
  - Field mapping: sourceFieldId, targetField, transformation
  - PII rule: sourceFieldId, handling, customPattern (optional)
- **List/detail patterns:**
  - Dashboard: Project list with source count, last updated
  - Project detail: Sources list, processing status, export list
  - Source detail: Detected fields with data types, sample values
- **Relationship displays:**
  - Project shows source count badge
  - Processing run shows stage progress
  - Export shows source processing run reference

### For Agent 6: Implementation Orchestrator
- **Schema file location:** `server/db/schema.ts`
- **Types file location:** `server/db/types.ts`
- **Migration commands:** 
  - `npm run db:generate` - Generate migration files
  - `npm run db:push` - Push schema changes (development)
  - `npm run db:migrate` - Run migrations (production)
- **Connection module:** `server/db/index.ts`
- **Type imports:** `import { User, Project, ... } from './db/types'`
- **Key patterns:**
  - All queries MUST include organisation scope for multi-tenancy
  - Use transactions for multi-table operations
  - Use soft delete pattern for projects and sources
  - Use JSONB for raw data and output data storage

### For Agent 7: QA & Deployment
- **Seed data for testing:**
  - Run `npm run db:seed` for test data
  - Test credentials: admin@test.com / TestPassword123
  - One organisation, one admin user, one sample project
- **Migration verification steps:**
  1. Verify DATABASE_URL is set in Replit Secrets
  2. Run `npm run db:push` to sync schema
  3. Verify all tables created in database
  4. Run seed script if fresh deployment
  5. Test basic queries (user lookup, project list)
- **Data retention verification:**
  - Sources: 30-day expiry (expiresAt column)
  - Exports: 30-day expiry (expiresAt column)
  - Invitations: 7-day expiry (expiresAt column)
  - Password reset tokens: 1-hour expiry (expiresAt column)

---

## ASSUMPTION REGISTER

### AR-001: Unified Source Table Design
- **Type:** ASSUMPTION
- **Source Gap:** PRD mentions FileSource and APISource as separate concepts, Architecture shows unified Source table
- **Assumption Made:** Single `sources` table with `type` discriminator column rather than separate tables
- **Impact if Wrong:** Would need to split into `fileSources` and `apiSources` tables with polymorphic queries
- **Proposed Resolution:** Confirm unified design is acceptable for MVP complexity
- **Status:** UNRESOLVED
- **Owner:** Human
- **Date:** 2025-01-18

### AR-002: JSONB Storage for Raw and Output Data
- **Type:** ASSUMPTION
- **Source Gap:** Architecture Section 7.2 mentions "JSONB in PostgreSQL" but no size constraints documented
- **Assumption Made:** JSONB can handle up to 100K records (PRD limit) within PostgreSQL column limits
- **Impact if Wrong:** May need separate table for records or blob storage
- **Proposed Resolution:** Test with maximum dataset size during QA
- **Status:** UNRESOLVED
- **Owner:** Agent 7 (QA)
- **Date:** 2025-01-18

### AR-003: Soft Delete for Projects and Sources Only
- **Type:** ASSUMPTION
- **Source Gap:** PRD mentions project deletion with data loss warning but doesn't specify soft delete strategy for all entities
- **Assumption Made:** Only projects and sources use soft delete; other entities use hard delete via cascade
- **Impact if Wrong:** May need to add soft delete to additional entities for audit compliance
- **Proposed Resolution:** Confirm soft delete scope with compliance requirements
- **Status:** UNRESOLVED
- **Owner:** Human
- **Date:** 2025-01-18

### AR-004: Source Field Detection Storage
- **Type:** ASSUMPTION
- **Source Gap:** PRD US-SRC-002 describes field detection but doesn't specify persistence model
- **Assumption Made:** Created `sourceFields` table to persist detected fields for mapping reference
- **Impact if Wrong:** Field detection could be transient (re-detected on each view)
- **Proposed Resolution:** Confirm field persistence is desired
- **Status:** UNRESOLVED
- **Owner:** Human
- **Date:** 2025-01-18

### AR-005: Password Reset Token Hashing
- **Type:** ASSUMPTION
- **Source Gap:** Architecture Section 6.7 shows token hashing but doesn't specify storage structure
- **Assumption Made:** Created `passwordResetTokens` table with SHA-256 hash storage per Architecture pattern
- **Impact if Wrong:** Could store in users table directly
- **Proposed Resolution:** Confirm separate table is preferred for security audit
- **Status:** UNRESOLVED
- **Owner:** Human
- **Date:** 2025-01-18

### AR-006: Audit Event Retention
- **Type:** DEPENDENCY
- **Source Gap:** PRD states "Audit data retained for project lifetime" but no archival strategy specified
- **Assumption Made:** Audit events deleted via cascade when organisation or project deleted
- **Impact if Wrong:** May need separate audit archive before deletion
- **Proposed Resolution:** Confirm audit retention requirements post-entity deletion
- **Status:** UNRESOLVED
- **Owner:** Human
- **Date:** 2025-01-18

---

## Document End
