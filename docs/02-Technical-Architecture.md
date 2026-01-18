# 02-Technical-Architecture.md - Foundry Technical Architecture Document

## FRAMEWORK VERSION

Framework: Agent Specification Framework v2.1
Constitution: Agent 0 - Agent Constitution v3
Status: Active

---

## VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1 | 2025-01-18 | Initial architecture document from PRD v1; Hygiene Gate: PASS |

---

## INHERITED CONSTITUTION

This document inherits and must comply with **Agent 0: Agent Constitution v3**.

This document must not restate or redefine global rules. It references the Constitution for global conventions.

---

## Section 1: Architectural Overview

### 1.1 High-Level Architecture

Foundry follows a **monolithic full-stack architecture** deployed as a single container on Replit. This pattern is mandated by the Replit deployment model (per Constitution Section D) and appropriate for the MVP scale expectations (10-50 concurrent users, 100,000 records per project).

```
+------------------------------------------------------------------+
|                         REPLIT CONTAINER                          |
|                                                                    |
|  +-------------------+     +----------------------------------+   |
|  |   Vite + React    |     |         Express.js Server        |   |
|  |   (Client SPA)    |     |                                  |   |
|  |                   |     |  +------------+  +------------+  |   |
|  |  - shadcn/ui      |---->|  | REST API   |  | Services   |  |   |
|  |  - Tailwind CSS   |     |  | Routes     |  | Layer      |  |   |
|  |  - React Query    |     |  +------------+  +------------+  |   |
|  +-------------------+     |         |              |         |   |
|                            |         v              v         |   |
|                            |  +---------------------------+   |   |
|                            |  |    Drizzle ORM            |   |   |
|                            |  |    (postgres-js driver)   |   |   |
|                            |  +---------------------------+   |   |
|                            +----------------------------------+   |
+------------------------------------------------------------------+
                                      |
                                      v
                    +----------------------------------+
                    |    PostgreSQL (Replit Managed)   |
                    |    via postgres-js driver        |
                    +----------------------------------+
```

### 1.2 Core Architectural Pattern

**Pattern:** Layered Monolith with Service Layer

```
Presentation Layer (React + shadcn/ui)
         |
         v
   API Layer (Express Routes)
         |
         v
  Service Layer (Business Logic)
         |
         v
 Data Access Layer (Drizzle ORM)
         |
         v
   PostgreSQL Database
```

**Rationale:**
- Simplicity for MVP development and debugging
- Single deployment unit fits Replit's model
- Clear separation of concerns without microservice overhead
- Service layer enables testability and business logic reuse

### 1.3 System Boundaries

| Boundary | Internal/External | Integration Type |
|----------|-------------------|------------------|
| User Browser | External | HTTPS, REST API |
| Replit Runtime | Internal | Node.js process |
| PostgreSQL | Internal | TCP via postgres-js |
| Teamwork Desk API | External | REST API (HTTPS) |
| GoHighLevel API | External | REST API (HTTPS) |
| Email Service (Resend) | External | REST API (Optional) |

### 1.4 Key Architectural Drivers

| Driver | Constraint | Architectural Response |
|--------|------------|----------------------|
| Replit Deployment | Single container, ephemeral filesystem | Monolithic architecture, database-only persistence |
| Multi-Tenancy | Organisation isolation required | Organisation-scoped queries, JWT-based tenant context |
| File Processing | Up to 50MB files, 100K records | Async processing with polling-based status |
| PII Detection | Privacy compliance required | Server-side detection, no PII in logs |
| API Rate Limits | External APIs have throttling | Backoff/retry with stored state |
| Cold Start | Replit sleeps after inactivity | Stateless design, fast startup |

---

## Section 2: Technology Stack

### 2.1 Frontend Stack

| Component | Technology | Version | Rationale | Alternatives Considered |
|-----------|------------|---------|-----------|------------------------|
| Framework | React | 18.x | Industry standard, large ecosystem, team familiarity | Vue.js (smaller ecosystem), Svelte (less mature) |
| Build Tool | Vite | 5.x | Fast HMR, native ESM, Replit-compatible | Create React App (deprecated), webpack (slower) |
| UI Components | shadcn/ui | Latest | Accessible, customisable, Tailwind-native | Radix UI (requires more styling), MUI (heavier) |
| Styling | Tailwind CSS | 4.x | Utility-first, design system ready | CSS Modules (more verbose), styled-components (runtime cost) |
| State Management | React Query | 5.x | Server state caching, automatic refetch | Redux (overkill for MVP), SWR (less features) |
| Routing | React Router | 6.x | Standard, nested routes support | TanStack Router (newer, less documentation) |
| Form Handling | React Hook Form + Zod | Latest | Type-safe validation, good DX | Formik (heavier), native forms (more boilerplate) |
| HTTP Client | Axios | 1.x | Request/response interceptors, error handling | fetch (less features), ky (less common) |

### 2.2 Backend Stack

| Component | Technology | Version | Rationale | Alternatives Considered |
|-----------|------------|---------|-----------|------------------------|
| Runtime | Node.js | 20.x LTS | Replit native, async I/O | Deno (less ecosystem), Bun (experimental) |
| Framework | Express.js | 4.x | Mature, middleware ecosystem | Fastify (newer), Koa (less middleware) |
| TypeScript Exec | tsx | Latest | Direct TS execution without compile | ts-node (slower), esbuild-register |
| ORM | Drizzle ORM | Latest | Type-safe, SQL-like, postgres-js compatible | Prisma (binary issues on Replit), TypeORM (heavier) |
| Validation | Zod | 3.x | Runtime type checking, inference | Yup (less TypeScript native), Joi (older) |
| Authentication | JWT (jsonwebtoken) | 9.x | Stateless, standard | Sessions (requires store), Passport (overkill) |
| Password Hashing | bcrypt | 5.x | Industry standard, configurable cost | argon2 (newer, less tested) |
| Rate Limiting | express-rate-limit | 7.x | Simple, memory-based | rate-limiter-flexible (more complex) |

### 2.3 Infrastructure Stack

| Component | Technology | Rationale | Replit Compatibility |
|-----------|------------|-----------|---------------------|
| Database | PostgreSQL (Replit Managed) | Required by framework | Native |
| DB Driver | postgres-js | CRITICAL: Required for Replit (NOT @neondatabase/serverless) | Native |
| Hosting | Replit | Deployment target | Native |
| Secrets | Replit Secrets | Required by platform | Native |
| Email (Optional) | Resend | Simple API, transactional focus | Compatible |

### 2.4 Development Tools

| Tool | Purpose | Rationale |
|------|---------|-----------|
| TypeScript | Type safety | Catches errors at compile time |
| ESLint | Code quality | Consistent code style |
| Prettier | Code formatting | Automated formatting |
| drizzle-kit | Migrations | Database schema management |

---

## Section 3: PRD-to-Architecture Traceability

### 3.1 Feature-to-Architecture Mapping

| PRD Feature | User Stories | Architectural Support | Key Components |
|-------------|--------------|----------------------|----------------|
| F-001: Authentication | US-AUTH-001, 002, 003 | JWT auth middleware, bcrypt hashing, token management | AuthService, AuthMiddleware, UserRepository |
| F-002: Organisation & Team | US-AUTH-004, US-ORG-001, 002 | Multi-tenant data model, invitation system | OrgService, InvitationService, RBAC middleware |
| F-003: Project Management | US-PROJ-001, 002, 003, 004 | CRUD operations, soft delete pattern | ProjectService, ProjectRepository |
| F-004: File Upload | US-SRC-001, 002, 003, 004 | Multer middleware, file parsing libraries, DB storage | UploadService, FileParserService, SourceRepository |
| F-005: API Connectors | US-SRC-005, 006, 007 | Connector abstraction, encrypted credential storage | ConnectorService, TeamworkConnector, GHLConnector |
| F-006: Field Mapping | US-MAP-001, 002, 003 | Schema registry, mapping engine | SchemaService, MappingService |
| F-007: PII Detection | US-PII-001, 002, 003, 004 | Detection engine, rule processing | PIIDetectionService, MaskingService |
| F-008: Processing Pipeline | US-PROC-001, 002, 003, 004 | Async job runner, stage tracking | ProcessingService, PipelineRunner |
| F-009: Export & Download | US-EXP-001, 002, 003 | Format generators, file serving | ExportService, FormatGenerators |
| F-010: Audit & Lineage | US-AUD-001, 002 | Event logging, lineage tracking | AuditService, LineageRepository |

### 3.2 Non-Functional Requirement Support

| NFR | PRD Spec | Architectural Support |
|-----|----------|----------------------|
| Response Time | Login < 500ms, Mapping UI < 2s | Connection pooling, indexed queries |
| File Size Limit | 50MB max | Multer limits, streaming where possible |
| Record Limit | 100,000 per project | Batch processing, progress tracking |
| Processing Time | < 1 hour for max dataset | Async processing, progress polling |
| PII Accuracy | > 85% precision, > 90% recall (email/phone) | Pattern-based detection with confidence scores |
| Security | RBAC, encrypted credentials | JWT claims, AES-256-GCM encryption |

---

## Section 4: Component Architecture

### 4.1 Component Diagram

```
+------------------------------------------------------------------+
|                        CLIENT APPLICATION                         |
+------------------------------------------------------------------+
|  Pages                  |  Components           |  Hooks          |
|  - LoginPage            |  - FileUpload         |  - useAuth      |
|  - DashboardPage        |  - DataPreview        |  - useProjects  |
|  - ProjectPage          |  - FieldMapper        |  - useSources   |
|  - SourcesPage          |  - PIIConfigPanel     |  - useProcessing|
|  - ConfigurationPage    |  - ProcessingStatus   |  - useExports   |
|  - ProcessingPage       |  - ExportList         |                 |
|  - ExportsPage          |  - AuditTimeline      |                 |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
|                        SERVER APPLICATION                         |
+------------------------------------------------------------------+
|  Routes (API Layer)                                               |
|  /api/auth/* | /api/organisations/* | /api/projects/*            |
|  /api/sources/* | /api/configuration/* | /api/processing/*       |
|  /api/exports/* | /api/audit/*                                   |
+------------------------------------------------------------------+
|  Middleware                                                       |
|  - authMiddleware (JWT validation)                                |
|  - orgContextMiddleware (tenant extraction)                       |
|  - rbacMiddleware (role checking)                                 |
|  - rateLimitMiddleware (request throttling)                       |
|  - errorMiddleware (error envelope formatting)                    |
+------------------------------------------------------------------+
|  Services (Business Logic)                                        |
|  - AuthService       - ProjectService     - ProcessingService    |
|  - OrgService        - SourceService      - ExportService        |
|  - InvitationService - MappingService     - AuditService         |
|  - FileParserService - PIIService         - ConnectorService     |
+------------------------------------------------------------------+
|  Data Access (Repositories)                                       |
|  - UserRepository        - SourceRepository                       |
|  - OrgRepository         - MappingRepository                      |
|  - ProjectRepository     - ProcessingRunRepository                |
|  - InvitationRepository  - ExportRepository                       |
+------------------------------------------------------------------+
```

### 4.2 Component Responsibility Matrix

| Component | Responsibilities | Dependencies | Interfaces |
|-----------|------------------|--------------|------------|
| **AuthService** | Login, registration, password reset, token generation | UserRepository, bcrypt, JWT | login(), register(), forgotPassword(), resetPassword() |
| **OrgService** | Organisation CRUD, member management | OrgRepository, UserRepository | getOrg(), updateOrg(), getMembers(), updateRole() |
| **InvitationService** | Create/validate invitations, email sending | InvitationRepository, EmailService | invite(), validateToken(), acceptInvite() |
| **ProjectService** | Project CRUD, ownership management | ProjectRepository | create(), list(), get(), update(), delete() |
| **SourceService** | Source management, file/API coordination | SourceRepository, FileParserService, ConnectorService | addFile(), addAPIConnection(), list(), delete() |
| **FileParserService** | Parse CSV/Excel/JSON, detect structure | External parsers (papaparse, xlsx, etc.) | parse(), detectStructure(), preview() |
| **ConnectorService** | API connector orchestration | TeamworkConnector, GHLConnector | testConnection(), importData(), getStatus() |
| **MappingService** | Schema selection, field mapping, transformations | MappingRepository, SchemaRegistry | setSchema(), mapFields(), validateMapping() |
| **PIIService** | Detect PII, apply rules, preview | PIIDetectionEngine, MaskingEngine | detect(), configureRules(), preview() |
| **ProcessingService** | Pipeline execution, status tracking | All processing components, ProcessingRunRepository | start(), getStatus(), cancel() |
| **ExportService** | Generate exports, manage downloads | ExportRepository, FormatGenerators | create(), list(), download() |
| **AuditService** | Lineage tracking, compliance reports | AuditRepository | logEvent(), getLineage(), generateReport() |

### 4.3 Service Interfaces

```typescript
// Example Service Interfaces (TypeScript)

interface IAuthService {
  register(email: string, password: string, name: string, inviteToken?: string): Promise<AuthResult>;
  login(email: string, password: string): Promise<AuthResult>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  verifyToken(token: string): Promise<TokenPayload>;
}

interface IProcessingService {
  start(projectId: number, userId: number): Promise<ProcessingRun>;
  getStatus(runId: number): Promise<ProcessingStatus>;
  getHistory(projectId: number): Promise<ProcessingRun[]>;
  cancel(runId: number): Promise<void>;
}

interface ISourceService {
  addFile(projectId: number, file: UploadedFile): Promise<Source>;
  addAPIConnection(projectId: number, connector: ConnectorConfig): Promise<Source>;
  list(projectId: number): Promise<Source[]>;
  get(sourceId: number): Promise<Source>;
  delete(sourceId: number): Promise<void>;
  preview(sourceId: number, limit?: number): Promise<PreviewData>;
}
```

---

## Section 5: Authentication and Authorisation

Per Constitution Section C, authentication uses JWT stored in localStorage with key `auth_token`.

### 5.1 Registration Flow

```
User                    Frontend                    Backend
  |                        |                           |
  |---(1) Submit form----->|                           |
  |                        |---(2) POST /api/auth/register-->|
  |                        |                           |
  |                        |      [Validate input]     |
  |                        |      [Check email unique] |
  |                        |      [Hash password]      |
  |                        |      [Create user]        |
  |                        |      [If invite: add to org]|
  |                        |      [Else: create org]   |
  |                        |      [Generate JWT]       |
  |                        |                           |
  |                        |<--(3) { data: { token, user } }--|
  |                        |                           |
  |                        |--[Store token in localStorage]--|
  |<--(4) Redirect to /-----|                           |
```

**First User Flow:** When registering without an invitation token, the system creates a new organisation with the user as Admin.

**Invited User Flow:** When registering with a valid invitation token, the user is added to the inviting organisation with the role specified in the invitation.

### 5.2 Login Flow

```
User                    Frontend                    Backend
  |                        |                           |
  |---(1) Submit form----->|                           |
  |                        |---(2) POST /api/auth/login---->|
  |                        |                           |
  |                        |      [Find user by email] |
  |                        |      [Verify password]    |
  |                        |      [Generate JWT]       |
  |                        |                           |
  |                        |<--(3) { data: { token, user } }--|
  |                        |                           |
  |                        |--[Store token in localStorage]--|
  |<--(4) Redirect to /-----|                           |
```

### 5.3 Token Management

| Aspect | Specification |
|--------|---------------|
| Token Type | JWT (JSON Web Token) |
| Algorithm | HS256 |
| Expiry | 24 hours |
| Storage | localStorage (key: `auth_token`) |
| Refresh | Not implemented for MVP (re-login required) |
| Payload | `{ userId, email, orgId, role, iat, exp }` |

**Token Validation Middleware:**

```typescript
// server/middleware/auth.ts
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid authorization header');
  }
  
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    req.user = payload;
    next();
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
```

### 5.4 Logout

Per Constitution Section C:
1. Delete `auth_token` from localStorage
2. Redirect to `/login`

No server-side session invalidation required (stateless JWT).

### 5.5 Password Reset Flow

```
User                    Frontend                    Backend                    Email
  |                        |                           |                          |
  |---(1) Request reset--->|                           |                          |
  |                        |---(2) POST /api/auth/forgot-password-->|             |
  |                        |                           |                          |
  |                        |      [Find user]          |                          |
  |                        |      [Generate reset token]|                         |
  |                        |      [Store token hash]   |                          |
  |                        |      [Send email]-------->|---------(3)------------->|
  |                        |                           |                          |
  |                        |<--(4) { data: { message } }--|                       |
  |                        |                           |                          |
  |<----(5) Email with reset link---------------------------------------------|
  |                        |                           |                          |
  |---(6) Click link, submit new password-->|          |                          |
  |                        |---(7) POST /api/auth/reset-password-->|              |
  |                        |                           |                          |
  |                        |      [Validate token]     |                          |
  |                        |      [Check expiry (1hr)] |                          |
  |                        |      [Hash new password]  |                          |
  |                        |      [Update user]        |                          |
  |                        |      [Invalidate token]   |                          |
  |                        |                           |                          |
  |                        |<--(8) { data: { message } }--|                       |
  |<--(9) Redirect to /login--|                        |                          |
```

**Reset Token:** Generated using `crypto.randomBytes(32)`, stored as SHA-256 hash, expires after 1 hour.

### 5.6 Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| **Admin** | Full access: manage organisation, invite users, modify roles, all project operations |
| **Member** | Project access: create projects, manage sources, run processing, export data |

**RBAC Middleware:**

```typescript
// server/middleware/rbac.ts
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    next();
  };
}

// Usage in routes
router.delete('/members/:userId', requireRole('admin'), removeMemberHandler);
```

**Permission Matrix:**

| Resource | Action | Admin | Member |
|----------|--------|-------|--------|
| Organisation | View | Yes | Yes |
| Organisation | Update | Yes | No |
| Members | List | Yes | Yes |
| Members | Invite | Yes | No |
| Members | Remove | Yes | No |
| Members | Change Role | Yes | No |
| Projects | Create | Yes | Yes |
| Projects | View (own org) | Yes | Yes |
| Projects | Update | Yes | Yes |
| Projects | Delete | Yes | Yes (owner only) |
| Sources | All operations | Yes | Yes |
| Processing | All operations | Yes | Yes |
| Exports | All operations | Yes | Yes |

---

## Section 6: Security Architecture (MVP)

### 6.1 Security Middleware Stack

Per Constitution Section D (Replit Platform):

```typescript
// server/index.ts - Security middleware setup
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

const app = express();

// CRITICAL: Trust proxy for Replit
app.set('trust proxy', 1);

// Security headers
app.use(helmet({ 
  contentSecurityPolicy: false // Relaxed for MVP, tighten post-launch
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.APP_URL 
    : true,
  credentials: true,
}));

// Request logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing
app.use(express.json({ limit: '1mb' }));
```

### 6.2 Rate Limiting Strategy

```typescript
// server/middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';

// Global limiter
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: true,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});

// Auth endpoint limiter (stricter)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window (per PRD F-001)
  standardHeaders: true,
  legacyHeaders: true,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many login attempts' } },
});

// File upload limiter
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  standardHeaders: true,
  legacyHeaders: true,
  message: { error: { code: 'RATE_LIMITED', message: 'Upload limit reached' } },
});
```

**Rate Limit Headers (MANDATORY on all responses):**
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

### 6.3 Input Validation

All inputs validated using Zod schemas at the API boundary:

```typescript
// server/routes/auth.ts
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
  name: z.string().min(1).max(100),
  inviteToken: z.string().optional(),
});

// URL parameter validation (MANDATORY)
import { parseIntParam } from '../lib/validation';

router.get('/projects/:id', async (req, res) => {
  const id = parseIntParam(req.params.id, 'project id');
  // ... continue with validated integer
});
```

### 6.4 Error Handling Pattern

Per Constitution Section C, all errors use the standard envelope:

```typescript
// server/errors/index.ts
export abstract class AppError extends Error {
  abstract statusCode: number;
  abstract code: string;
}

export class BadRequestError extends AppError {
  statusCode = 400;
  code = 'BAD_REQUEST';
}

export class UnauthorizedError extends AppError {
  statusCode = 401;
  code = 'UNAUTHORIZED';
}

export class ForbiddenError extends AppError {
  statusCode = 403;
  code = 'FORBIDDEN';
}

export class NotFoundError extends AppError {
  statusCode = 404;
  code = 'NOT_FOUND';
  constructor(resource: string, id?: number | string) {
    super(id ? `${resource} with id ${id} not found` : `${resource} not found`);
  }
}

// Error middleware
export function errorMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message }
    });
  }
  
  console.error('Unhandled error:', err);
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
  });
}
```

### 6.5 Password Security

```typescript
// server/lib/password.ts
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10; // Per PRD F-001 requirements

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### 6.6 Credential Encryption

API connector credentials (Teamwork Desk API keys, GoHighLevel tokens) MUST be encrypted at rest:

```typescript
// server/lib/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

export function encrypt(text: string, secret: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.scryptSync(secret, 'salt', 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string, secret: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = crypto.scryptSync(secret, 'salt', 32);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### 6.7 Secure Token Generation

All security tokens MUST use `crypto` module:

```typescript
// server/lib/tokens.ts
import { randomBytes, createHash } from 'crypto';

export function generateResetToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  const hash = createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

export function generateInviteToken(): string {
  return randomBytes(32).toString('base64url');
}
```

---

## Section 7: Data Architecture Overview

*Note: Detailed schema definitions are owned by Agent 3 (Data Modeling). This section provides architectural context.*

### 7.1 Data Flow Overview

```
+----------------+     +------------------+     +------------------+
|  File Upload   |---->|  File Parser     |---->|  Source Record   |
|  (CSV/XLSX/    |     |  (papaparse,     |     |  (metadata +     |
|   JSON)        |     |   xlsx, etc.)    |     |   raw data ref)  |
+----------------+     +------------------+     +------------------+
                                                        |
+----------------+     +------------------+              v
|  API Connector |---->|  Import Service  |---->|  Source Records  |
|  (Teamwork,    |     |  (rate-limited,  |     |  (incremental    |
|   GoHighLevel) |     |   paginated)     |     |   import state)  |
+----------------+     +------------------+     +------------------+
                                                        |
                                                        v
+------------------------------------------------------------------+
|                    PROCESSING PIPELINE                            |
|  +------------+  +------------+  +------------+  +------------+  |
|  | Ingest     |->| Normalise  |->| De-identify|->| Filter     |  |
|  | (parse raw)|  | (schema    |  | (PII rules)|  | (quality   |  |
|  |            |  |  mapping)  |  |            |  |  thresholds|  |
|  +------------+  +------------+  +------------+  +------------+  |
+------------------------------------------------------------------+
                                                        |
                                                        v
                    +------------------+     +------------------+
                    |  Output Records  |---->|  Export Service  |
                    |  (processed,     |     |  (JSONL, Q&A,    |
                    |   de-identified) |     |   JSON formats)  |
                    +------------------+     +------------------+
```

### 7.2 Storage Strategy

| Data Type | Storage Location | Retention | Notes |
|-----------|------------------|-----------|-------|
| User data | PostgreSQL | Permanent | Core entities |
| Organisation data | PostgreSQL | Permanent | Tenant isolation |
| Project config | PostgreSQL | Permanent | Mappings, rules |
| Source metadata | PostgreSQL | 30 days | File refs, structure |
| Raw file content | PostgreSQL (JSONB) | 30 days | Stored as JSON array |
| Processing runs | PostgreSQL | Permanent | Status, lineage |
| Export files | PostgreSQL (JSONB) | 30 days | Output data stored as JSON |
| Audit events | PostgreSQL | Project lifetime | Compliance trail |

**Note:** Given Replit's ephemeral filesystem, all persistent data is stored in PostgreSQL. Raw files and exports are stored as JSONB columns rather than filesystem references.

### 7.3 Multi-Tenancy Model

All data queries MUST be scoped to the user's organisation:

```typescript
// Every query includes organisation scope
async function getProjects(orgId: number): Promise<Project[]> {
  return db.select()
    .from(projects)
    .where(eq(projects.organisationId, orgId))
    .orderBy(desc(projects.updatedAt));
}
```

**Tenant Context Flow:**
1. JWT contains `orgId` claim
2. `orgContextMiddleware` extracts `orgId` to `req.orgId`
3. All service methods require `orgId` parameter
4. All queries filter by `organisationId`

### 7.4 Caching Strategy (MVP)

For MVP, caching is minimal:
- Database connection pooling (10 connections)
- React Query client-side caching (5 min stale time)
- No server-side cache (complexity vs. benefit for MVP scale)

**Post-MVP consideration:** Redis for processing job state if polling overhead becomes problematic.

---

## Section 8: Third-Party Integrations

### 8.1 Teamwork Desk API

| Aspect | Specification |
|--------|---------------|
| **Classification** | REQUIRED (MVP) |
| **API Type** | REST API |
| **Authentication** | API Key (Header: `Authorization: Bearer {api_key}`) |
| **Base URL** | `https://{subdomain}.teamwork.com/desk/v1` |
| **Rate Limits** | TBD - requires API documentation review |
| **Data Retrieved** | Tickets, conversations, messages |
| **Failure Modes** | Invalid credentials, rate limit exceeded, service unavailable |
| **Fallback** | Retry with exponential backoff; surface error to user after 3 retries |

**Connection Validation:**
```typescript
async function testTeamworkConnection(credentials: TeamworkCredentials): Promise<boolean> {
  try {
    const response = await axios.get(`https://${credentials.subdomain}.teamwork.com/desk/v1/me`, {
      headers: { Authorization: `Bearer ${credentials.apiKey}` },
      timeout: 30000,
    });
    return response.status === 200;
  } catch {
    return false;
  }
}
```

### 8.2 GoHighLevel API

| Aspect | Specification |
|--------|---------------|
| **Classification** | REQUIRED (MVP) |
| **API Type** | REST API |
| **Authentication** | API Key or OAuth (TBD based on documentation) |
| **Base URL** | `https://rest.gohighlevel.com/v1` |
| **Rate Limits** | TBD - requires API documentation review |
| **Data Retrieved** | Contacts, conversations, pipeline records |
| **Failure Modes** | Invalid credentials, rate limit exceeded, service unavailable |
| **Fallback** | Retry with exponential backoff; surface error to user after 3 retries |

### 8.3 Email Service (Resend)

| Aspect | Specification |
|--------|---------------|
| **Classification** | OPTIONAL |
| **API Type** | REST API |
| **Authentication** | API Key |
| **Rate Limits** | 10 emails/second (free tier), higher for paid |
| **Use Cases** | Invitation emails, password reset |
| **Failure Modes** | Invalid API key, rate limit, delivery failure |
| **Fallback** | Log token to console; feature disabled if API key missing |

**Optional Service Pattern:**
```typescript
// server/lib/features.ts
export const features = {
  email: !!process.env.RESEND_API_KEY,
};

// server/services/email.ts
export async function sendInvitationEmail(email: string, token: string): Promise<void> {
  if (!features.email) {
    console.warn(`[Email Disabled] Invitation token for ${email}: ${token}`);
    return;
  }
  
  await resend.emails.send({
    from: 'Foundry <noreply@foundry.app>',
    to: email,
    subject: 'You have been invited to Foundry',
    html: `<a href="${env.APP_URL}/invite/${token}">Accept Invitation</a>`,
  });
}
```

### 8.4 API Connector Abstraction

```typescript
// server/connectors/base.ts
export interface IConnector {
  testConnection(): Promise<boolean>;
  importData(config: ImportConfig): AsyncGenerator<ImportedRecord>;
  getStatus(): Promise<ConnectorStatus>;
}

export interface ImportConfig {
  dateRange?: { start: Date; end: Date };
  filters?: Record<string, string>;
  lastImportedId?: string; // For incremental imports
}

export interface ConnectorStatus {
  lastImport: Date | null;
  recordCount: number;
  rateLimitRemaining?: number;
}
```

---

## Section 9: Replit Deployment Configuration

### 9.1 .replit File

```toml
entrypoint = "server/index.ts"
modules = ["nodejs-20"]

[nix]
channel = "stable-24_05"

[deployment]
run = ["sh", "-c", "npm run start"]
deploymentTarget = "cloudrun"

[[ports]]
localPort = 5000
externalPort = 80
```

### 9.2 Environment Variables

| Variable | Classification | Purpose | Used By | Default |
|----------|---------------|---------|---------|---------|
| `NODE_ENV` | Runtime | Environment mode | All | `development` |
| `PORT` | Runtime | Server port | Express | `5000` (prod), `3001` (dev) |
| `DATABASE_URL` | Critical | PostgreSQL connection | Drizzle ORM | None (required) |
| `JWT_SECRET` | Required | Token signing | AuthService | Dev fallback |
| `SESSION_SECRET` | Required | Credential encryption | EncryptionService | Dev fallback |
| `APP_URL` | Required | Application base URL | Email links, CORS | `http://localhost:5000` |
| `RESEND_API_KEY` | Optional | Email sending | EmailService | None (feature disabled) |

### 9.3 Port Configuration

Per Constitution Section C:

| Environment | Vite (Frontend) | Express (Backend) | Notes |
|-------------|-----------------|-------------------|-------|
| Production | N/A (static files) | 5000 | Express serves built React app |
| Development | 5000 | 3001 | Vite proxies `/api/*` to Express |

### 9.4 Package.json Scripts

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "tsx watch server/index.ts",
    "dev:client": "vite",
    "build": "vite build && tsc -p tsconfig.server.json",
    "start": "NODE_ENV=production tsx server/index.ts",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx server/db/migrate.ts",
    "db:push": "drizzle-kit push"
  }
}
```

---

## Section 10: Architecture Decision Records

### ADR-001: Monolithic Architecture

**Context:** Foundry requires a web application that can be deployed on Replit with PostgreSQL persistence.

**Decision:** Adopt a monolithic full-stack architecture with Express.js backend and React frontend in a single deployment unit.

**Alternatives Considered:**
1. Microservices - Rejected: Replit's single-container model doesn't support multiple services
2. Serverless functions - Rejected: Replit doesn't provide serverless infrastructure
3. BFF + separate services - Rejected: Adds complexity without deployment benefit

**Consequences:**
- (+) Simple deployment and debugging
- (+) Shared code between frontend and backend
- (+) Single codebase, single repo
- (-) Scaling is all-or-nothing
- (-) Long-term modularity requires discipline

**Replit Compatibility:** Confirmed - single container deployment matches Replit model.

---

### ADR-002: PostgreSQL with postgres-js Driver

**Context:** Application requires persistent storage with SQL capabilities. Replit provides managed PostgreSQL.

**Decision:** Use PostgreSQL via Replit's managed database with the `postgres-js` driver and Drizzle ORM.

**Alternatives Considered:**
1. `@neondatabase/serverless` - Rejected: Causes "fetch failed" errors in Replit environment
2. `pg` (node-postgres) - Rejected: Less ergonomic, more configuration required
3. SQLite - Rejected: Ephemeral filesystem makes it unsuitable

**Consequences:**
- (+) Native Replit compatibility
- (+) postgres-js has excellent performance
- (+) Drizzle provides type-safe queries
- (-) Must use specific driver, not the one in Drizzle docs

**Replit Compatibility:** CRITICAL - Must use postgres-js, NOT @neondatabase/serverless.

---

### ADR-003: JWT Authentication with localStorage

**Context:** Application needs user authentication with stateless session management suitable for Replit's cold-start behavior.

**Decision:** Use JWT tokens stored in localStorage with 24-hour expiry.

**Alternatives Considered:**
1. Server-side sessions - Rejected: Requires session store, complicates cold starts
2. HTTP-only cookies - Considered: Better XSS protection but complicates API calls
3. Refresh tokens - Deferred: MVP simplicity favored over extended sessions

**Consequences:**
- (+) Stateless - survives cold starts
- (+) Simple implementation
- (+) Standard pattern
- (-) XSS vulnerability if token exposed (mitigated by CSP)
- (-) Cannot invalidate tokens server-side

**Replit Compatibility:** Confirmed - stateless design fits cold-start model.

---

### ADR-004: Async Processing with Polling

**Context:** Processing pipelines may run for extended periods (up to 1 hour for 100K records). Need status tracking without blocking HTTP requests.

**Decision:** Implement async processing with database-persisted status and client-side polling.

**Alternatives Considered:**
1. WebSocket push - Deferred: Additional complexity for MVP
2. Server-Sent Events - Deferred: Similar complexity to WebSocket
3. External job queue (Bull, BullMQ) - Rejected: Requires Redis, adds infrastructure

**Consequences:**
- (+) Works within Replit constraints
- (+) Processing state survives container restarts
- (+) Simple client implementation
- (-) Polling adds some server load
- (-) Not real-time (30-second update intervals)

**Replit Compatibility:** Confirmed - no persistent process required, status in database.

---

### ADR-005: In-Database File Storage

**Context:** Replit has ephemeral filesystem. Raw uploaded files and generated exports need persistence.

**Decision:** Store file content as JSONB in PostgreSQL rather than filesystem references.

**Alternatives Considered:**
1. Cloud storage (S3, GCS) - Deferred: Adds external dependency, cost
2. Filesystem with cleanup - Rejected: Data loss on container restart
3. Base64 in TEXT column - Rejected: JSONB more flexible for structured data

**Consequences:**
- (+) Survives container restarts
- (+) Atomic with other data operations
- (+) No external service dependency
- (-) Database size grows with usage
- (-) 50MB limit helps manage this

**Replit Compatibility:** Confirmed - works within Replit constraints.

---

### ADR-006: Pattern-Based PII Detection

**Context:** Need to detect PII (names, emails, phones, addresses) with >85% precision and >90% recall for common types.

**Decision:** Use pattern-based detection with regex for structured PII (email, phone, SSN) and heuristics for names/addresses.

**Alternatives Considered:**
1. ML-based NER (spaCy, etc.) - Deferred: Binary dependencies problematic on Replit
2. External API (AWS Comprehend, Google DLP) - Deferred: Adds cost, latency, dependency
3. Rule-only approach - Rejected: Insufficient for name detection

**Consequences:**
- (+) No external dependencies
- (+) Predictable performance
- (+) Easy to extend with custom patterns
- (-) Name detection less accurate than ML
- (-) English-language focused

**Technical Approach:**
- Regex patterns for: email, phone, SSN, date of birth, credit card
- Dictionary + heuristics for: names (common first/last name lists)
- Geocoding patterns for: addresses (zip codes, state abbreviations)
- Confidence scoring based on pattern match strength

**Replit Compatibility:** Confirmed - no binary dependencies.

---

### ADR-007: shadcn/ui Component System

**Context:** Need accessible, customizable UI components that work with Tailwind CSS.

**Decision:** Use shadcn/ui as the component system.

**Alternatives Considered:**
1. Radix UI directly - Rejected: Requires more styling work
2. Material UI - Rejected: Heavier bundle, less Tailwind integration
3. Chakra UI - Rejected: Different styling paradigm
4. Custom components - Rejected: Time investment not justified for MVP

**Consequences:**
- (+) Accessible by default (Radix primitives)
- (+) Fully customizable (copy components into codebase)
- (+) Tailwind-native styling
- (+) Consistent design language
- (-) Must manage component updates manually

**Replit Compatibility:** Confirmed - standard React components.

---

## Document Validation

### Completeness Checklist
- [x] All PRD features have architectural support
- [x] Technology stack complete with rationale
- [x] Auth flows fully specified
- [x] Integrations classified (required/optional)
- [x] Replit configuration complete
- [x] Security middleware specified
- [x] Minimum 5 ADRs documented (7 provided)

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

### Confidence Scores

| Section | Score (1-10) | Notes |
|---------|--------------|-------|
| Architectural Overview | 9 | Clear pattern, well-justified |
| Technology Stack | 9 | All selections have rationale |
| PRD Traceability | 9 | Complete mapping |
| Component Architecture | 8 | Service interfaces defined |
| Authentication | 9 | Complete flows |
| Security | 9 | MVP-appropriate measures |
| Data Architecture | 8 | Defers schema details to Agent 3 |
| Integrations | 7 | API details pending documentation review |
| ADRs | 9 | 7 significant decisions documented |
| Overall | 8.5 | Solid architecture with clear tradeoffs |

### Document Status: COMPLETE

---

## Downstream Agent Handoff Brief

### Global Platform Context (All Agents)
Per Constitution Section C: Standard response envelopes, error envelopes, auth storage, and API conventions apply.
Per Constitution Section D: Replit platform non-negotiables apply (postgres-js driver, ports, deployment model).

### For Agent 3: Data Modeling
- Per Constitution Section D: PostgreSQL via Replit managed DB; postgres-js driver
- ORM: Drizzle ORM (Core Select API only)
- Connection: Pool with caching enabled (max: 10, idle_timeout: 20)
- Key entities implied by architecture:
  - User, Organisation, OrganisationMember
  - Invitation (7-day expiry)
  - Project
  - Source (with JSONB for raw data)
  - FieldMapping, PIIRule
  - ProcessingRun, ProcessingStage
  - Export (with JSONB for output data)
  - AuditEvent
- Multi-tenancy: All entities scoped to Organisation

### For Agent 4: API Contract
- Framework: Express.js
- Per Constitution Section C: Standard response envelope and error envelope formats apply
- Auth: JWT Bearer tokens (per Constitution Section C)
- Rate limiting: Global (100/15min), Auth (5/15min), Upload (20/hr)
- URL parameters: Must use parseIntParam validation
- Error classes: BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError

### For Agent 5: UI/UX Specification
- Framework: React + Vite
- Components: shadcn/ui
- Styling: Tailwind CSS v4 with CSS variables
- State: React Query for server state
- Forms: React Hook Form + Zod
- Routing: React Router v6
- Auth storage: localStorage, key `auth_token`

### For Agent 6: Implementation Orchestrator
- Security middleware required: helmet, cors, express-rate-limit, morgan
- Graceful shutdown handler required
- parseIntParam validation required for all URL params
- Route registration order: specific routes before parameterized
- Async processing: use proper error handling with awaited catch handlers
- Batch processing: use interval pattern (check every 100 records)
- File storage: JSONB in PostgreSQL (no filesystem)
- Credential encryption: AES-256-GCM via crypto module

### For Agent 7: QA & Deployment
- Per Constitution Section C: Health endpoint `GET /api/health` returns `{ "status": "ok", "timestamp": "<ISO8601>" }`
- Deployment verification checklist:
  - [ ] PORT defaults to 5000
  - [ ] Server binds to 0.0.0.0
  - [ ] Trust proxy enabled
  - [ ] postgres-js driver used (NOT @neondatabase/serverless)
  - [ ] Vite watch exclusions configured
  - [ ] Rate limit headers present
  - [ ] Environment variables documented

---

## ASSUMPTION REGISTER

### AR-001: Teamwork Desk API Rate Limits
- **Type:** DEPENDENCY
- **Source Gap:** PRD specifies Teamwork Desk integration but rate limit details not provided
- **Assumption Made:** Standard rate limiting pattern (exponential backoff, 3 retries) will be sufficient
- **Impact if Wrong:** May need specific rate limit handling per API documentation
- **Proposed Resolution:** Review Teamwork Desk API documentation before implementation
- **Status:** UNRESOLVED
- **Owner:** Agent 6 (Implementation)
- **Date:** 2025-01-18

### AR-002: GoHighLevel API Authentication Method
- **Type:** DEPENDENCY
- **Source Gap:** PRD specifies GoHighLevel integration but auth method not specified
- **Assumption Made:** API key authentication similar to other integrations
- **Impact if Wrong:** May require OAuth flow implementation
- **Proposed Resolution:** Review GoHighLevel API documentation before implementation
- **Status:** UNRESOLVED
- **Owner:** Agent 6 (Implementation)
- **Date:** 2025-01-18

### AR-003: PII Detection Library Availability
- **Type:** RISK
- **Source Gap:** No specific PII detection library mentioned in PRD
- **Assumption Made:** Pattern-based detection with custom implementation will meet 85%+ precision target
- **Impact if Wrong:** May need external API or ML model for name detection
- **Proposed Resolution:** Validate detection accuracy in QA phase; have external API fallback ready
- **Status:** UNRESOLVED
- **Owner:** Agent 7 (QA)
- **Date:** 2025-01-18

### AR-004: 50MB File Memory Handling
- **Type:** RISK
- **Source Gap:** PRD specifies 50MB max but Replit memory constraints not quantified
- **Assumption Made:** 50MB files can be parsed in memory on Replit's standard tier
- **Impact if Wrong:** May need streaming parsers or lower file size limits
- **Proposed Resolution:** Test with maximum size files during QA
- **Status:** UNRESOLVED
- **Owner:** Agent 7 (QA)
- **Date:** 2025-01-18

### AR-005: Processing Pipeline Duration
- **Type:** RISK
- **Source Gap:** PRD specifies "< 1 hour for 100K records" but Replit request timeout unclear
- **Assumption Made:** Async processing with polling allows long-running operations
- **Impact if Wrong:** May need to checkpoint and resume processing across multiple requests
- **Proposed Resolution:** Test with maximum dataset size; implement checkpoint resume if needed
- **Status:** UNRESOLVED
- **Owner:** Agent 6 (Implementation)
- **Date:** 2025-01-18

### AR-006: Email Service Degradation
- **Type:** ASSUMPTION
- **Source Gap:** PRD doesn't specify behavior when email service unavailable
- **Assumption Made:** Console logging of tokens is acceptable fallback for MVP
- **Impact if Wrong:** May need alternative notification mechanism
- **Proposed Resolution:** Confirm acceptable MVP behavior with product owner
- **Status:** UNRESOLVED
- **Owner:** Human
- **Date:** 2025-01-18

---

## Document End
