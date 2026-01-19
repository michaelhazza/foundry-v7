/**
 * Shared types between client and server.
 */

// User types
export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithRole extends User {
  organisationId: number;
  role: 'admin' | 'member';
}

// Organisation types
export interface Organisation {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganisationMember {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'member';
  createdAt: string;
}

// Invitation types
export interface Invitation {
  id: number;
  email: string;
  role: 'admin' | 'member';
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
  organisationName?: string;
}

// Project types
export type ProjectStatus = 'draft' | 'configured' | 'processing' | 'completed';
export type TargetSchema = 'qa_pairs' | 'instruction' | 'chat' | 'structured' | 'custom';

export interface Project {
  id: number;
  organisationId: number;
  name: string;
  description: string | null;
  targetSchema: TargetSchema | null;
  status: ProjectStatus;
  createdById: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStats {
  sourceCount: number;
  totalRecords: number;
  runCount: number;
  exportCount: number;
}

// Source types
export type SourceType = 'file' | 'api';
export type SourceStatus = 'pending' | 'processing' | 'ready' | 'error';
export type FileType = 'csv' | 'xlsx' | 'json';
export type ConnectorType = 'teamwork' | 'gohighlevel';

export interface Source {
  id: number;
  projectId: number;
  name: string;
  type: SourceType;
  status: SourceStatus;
  fileName: string | null;
  fileType: FileType | null;
  fileSize: number | null;
  filePath: string | null;
  connectorType: ConnectorType | null;
  connectorConfig: Record<string, unknown> | null;
  recordCount: number | null;
  errorMessage: string | null;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SourceField {
  id: number;
  sourceId: number;
  name: string;
  path: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  sampleValues: unknown[] | null;
  nullCount: number;
  uniqueCount: number | null;
  createdAt: string;
}

// Field mapping types
export interface FieldMapping {
  id: number;
  projectId: number;
  sourceFieldId: number;
  targetField: string;
  transformation: {
    type?: 'direct' | 'concatenate' | 'template' | 'format';
    config?: Record<string, unknown>;
  } | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FieldMappingWithSource extends FieldMapping {
  sourceFieldName: string;
  sourceFieldPath: string;
  sourceFieldDataType: string;
}

// PII types
export type PiiType = 'email' | 'phone' | 'name' | 'address' | 'ssn' | 'credit_card' | 'custom';
export type PiiHandling = 'mask' | 'redact' | 'hash' | 'keep';

export interface PiiRule {
  id: number;
  sourceId: number;
  sourceFieldId: number;
  piiType: PiiType;
  handling: PiiHandling;
  confidence: number;
  isAutoDetected: boolean;
  customPattern: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PiiRuleWithField extends PiiRule {
  fieldName: string;
}

export interface DetectedPii {
  sourceFieldId: number;
  fieldName: string;
  piiType: PiiType;
  confidence: number;
  handling: PiiHandling;
}

// Processing types
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type ProcessingStage = 'extraction' | 'pii_detection' | 'mapping' | 'quality_filter' | 'export';

export interface ProcessingRun {
  id: number;
  projectId: number;
  status: ProcessingStatus;
  configSnapshot: {
    targetSchema?: TargetSchema;
    qualitySettings?: QualitySettings;
    sourceIds?: number[];
  };
  totalRecords: number;
  processedRecords: number;
  filteredRecords: number;
  errorRecords: number;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  createdById: number;
  createdAt: string;
}

export interface ProcessingStageRecord {
  id: number;
  runId: number;
  stage: ProcessingStage;
  status: ProcessingStatus;
  inputCount: number;
  outputCount: number;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
}

export interface QualitySettings {
  minLength?: number;
  maxLength?: number;
  removeDuplicates?: boolean;
  removeEmpty?: boolean;
}

// Export types
export type ExportFormat = 'jsonl' | 'csv' | 'parquet';

export interface Export {
  id: number;
  runId: number;
  format: ExportFormat;
  fileName: string;
  filePath: string;
  fileSize: number | null;
  recordCount: number | null;
  downloadCount: number;
  expiresAt: string | null;
  createdById: number;
  createdAt: string;
}

// Audit types
export interface AuditEvent {
  id: number;
  projectId: number;
  userId: number | null;
  eventType: string;
  eventData: Record<string, unknown> | null;
  resourceType: string | null;
  resourceId: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditEventWithUser extends AuditEvent {
  userName: string | null;
}

// Lineage types
export interface LineageNode {
  id: string;
  type: 'source' | 'processing' | 'export';
  label: string;
}

export interface LineageEdge {
  from: string;
  to: string;
}

export interface Lineage {
  nodes: LineageNode[];
  edges: LineageEdge[];
  sources: Pick<Source, 'id' | 'name' | 'type' | 'recordCount' | 'createdAt'>[];
  processingRuns: Pick<ProcessingRun, 'id' | 'status' | 'totalRecords' | 'processedRecords' | 'createdAt' | 'completedAt'>[];
  exports: Pick<Export, 'id' | 'runId' | 'format' | 'recordCount' | 'createdAt'>[];
}

// PII Summary types
export interface PiiSummary {
  totalRules: number;
  byType: Array<{ type: PiiType; count: number }>;
  byHandling: Array<{ handling: PiiHandling; count: number }>;
  rules: Array<{ field: string; piiType: PiiType; handling: PiiHandling }>;
}

// API Response types
export interface ApiMeta {
  timestamp: string;
  requestId: string;
}

export interface ApiResponse<T> {
  data: T;
  meta: ApiMeta;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  meta: ApiMeta;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

// Schema types
export interface SchemaField {
  name: string;
  type: string;
  required?: boolean;
}

export interface SchemaDefinition {
  id: string;
  name: string;
  fields: SchemaField[];
}

export interface ProjectSchemaConfig {
  targetSchema: TargetSchema | null;
  schemaDefinition: {
    name: string;
    fields: SchemaField[];
  } | null;
  availableSchemas: SchemaDefinition[];
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  organisationName?: string;
  inviteToken?: string;
}

export interface AuthResponse {
  user: UserWithRole;
  token: string;
}
