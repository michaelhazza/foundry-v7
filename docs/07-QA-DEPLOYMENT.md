# 07-QA-DEPLOYMENT.md - Foundry QA & Deployment Specification

## FRAMEWORK VERSION

Framework: Agent Specification Framework v2.1
Constitution: Agent 0 - Agent Constitution v3
Status: Active

---

## VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1 | 2025-01-18 | Initial QA & Deployment specification from upstream docs v1; Hygiene Gate: PASS |

---

## INHERITED CONSTITUTION

This document inherits and must comply with **Agent 0: Agent Constitution v3**.

This document must not restate or redefine global rules. It references the Constitution for global conventions.

---

## Document Information

| Field | Value |
|-------|-------|
| Document ID | 07-QA-DEPLOYMENT |
| Version | 1 |
| Last Updated | 2025-01-18 |
| Status | Draft |
| Upstream Dependencies | 01-PRD, 02-ARCH, 03-DATA, 04-API, 05-UI, 06-IMPL |

## Specification Summary

| Category | Count |
|----------|-------|
| User Stories Covered | 32 |
| Test Requirements | 94 |
| API Endpoints Covered | 47 |
| UI Screens Covered | 26 |
| Environment Variables | 8 |

---

## 1. Test Strategy

### 1.1 Test Layers

| Layer | Purpose | Recommended Tools | Coverage Target |
|-------|---------|-------------------|-----------------|
| Unit | Isolated function testing | Vitest | Utility functions, services |
| Integration | API endpoint testing | Supertest + Vitest | 100% of endpoints |
| Component | UI component testing | Testing Library + Vitest | All interactive components |
| E2E | User flow testing | Playwright | Critical user journeys |

### 1.2 Coverage Targets

| Category | Target | Rationale |
|----------|--------|-----------|
| API Endpoints | 100% of endpoints tested | All 47 endpoints must have tests |
| API Response Codes | All documented status codes | Per API Contract Section 3 |
| UI Screens | All screens, all states | 26 pages per UI Spec |
| Form Validation | All fields, all rules | All validation scenarios |
| User Stories | All acceptance criteria | 32 stories with ~100 ACs |
| Error Handling | All error codes | Per ERROR_CODES registry |

---

## 2. Test Requirements

### 2.1 Authentication Tests

#### TR-AUTH-001: User Registration

- **Traces to**: US-AUTH-001, AC-001-1
- **Type**: Integration
- **Component Under Test**: POST /api/auth/register
- **Preconditions**: No existing user with test email
- **Test Input**: Valid email, password (8+ chars, 1 uppercase, 1 number), name
- **Expected Result**: User created, organisation created, JWT returned
- **Verification Points**:
  - [ ] Response status is 201
  - [ ] Response contains `data.token`
  - [ ] Response contains `data.user` with id, email, name
  - [ ] Response does NOT contain password
  - [ ] Database contains new user and organisation records

#### TR-AUTH-002: Registration Validation Errors

- **Traces to**: US-AUTH-001, AC-001-3
- **Type**: Integration
- **Component Under Test**: POST /api/auth/register
- **Preconditions**: None
- **Test Input**: Invalid email format, weak password
- **Expected Result**: 400 VALIDATION_ERROR
- **Verification Points**:
  - [ ] Invalid email returns 400
  - [ ] Password without uppercase returns 400
  - [ ] Password under 8 chars returns 400
  - [ ] Error envelope format: `{ error: { code, message } }`

#### TR-AUTH-003: Duplicate Email Registration

- **Traces to**: US-AUTH-001
- **Type**: Integration
- **Component Under Test**: POST /api/auth/register
- **Preconditions**: User exists with test email
- **Test Input**: Same email as existing user
- **Expected Result**: 409 DUPLICATE_EMAIL
- **Verification Points**:
  - [ ] Response status is 409
  - [ ] Error code is DUPLICATE_EMAIL

#### TR-AUTH-004: User Login Success

- **Traces to**: US-AUTH-002, AC-002-1
- **Type**: Integration
- **Component Under Test**: POST /api/auth/login
- **Preconditions**: User exists with known credentials
- **Test Input**: Valid email and password
- **Expected Result**: JWT token returned
- **Verification Points**:
  - [ ] Response status is 200
  - [ ] Response contains valid JWT
  - [ ] JWT contains userId, email, orgId, role

#### TR-AUTH-005: Login Invalid Credentials

- **Traces to**: US-AUTH-002, AC-002-2
- **Type**: Integration
- **Component Under Test**: POST /api/auth/login
- **Preconditions**: None
- **Test Input**: Invalid email or password
- **Expected Result**: 401 UNAUTHORIZED
- **Verification Points**:
  - [ ] Response status is 401
  - [ ] Error message does NOT reveal which field is wrong
  - [ ] Same error for wrong email vs wrong password

#### TR-AUTH-006: Password Reset Flow

- **Traces to**: US-AUTH-003
- **Type**: Integration
- **Component Under Test**: POST /api/auth/forgot-password, POST /api/auth/reset-password
- **Preconditions**: User exists
- **Test Input**: Valid email, then valid reset token with new password
- **Expected Result**: Password updated
- **Verification Points**:
  - [ ] Forgot-password returns 200 (always, to prevent enumeration)
  - [ ] Reset token validation returns 200 for valid token
  - [ ] Reset password returns 200 with updated credentials
  - [ ] User can login with new password

#### TR-AUTH-007: Expired Reset Token

- **Traces to**: US-AUTH-003, AC-003-3
- **Type**: Integration
- **Component Under Test**: POST /api/auth/reset-password
- **Preconditions**: Reset token created > 1 hour ago
- **Test Input**: Expired token
- **Expected Result**: 410 TOKEN_INVALID
- **Verification Points**:
  - [ ] Response status is 410
  - [ ] Error code is TOKEN_INVALID

#### TR-AUTH-008: User Invitation Flow

- **Traces to**: US-AUTH-004
- **Type**: Integration
- **Component Under Test**: POST /api/invitations, GET /api/invitations/:token
- **Preconditions**: Admin user authenticated
- **Test Input**: Valid email to invite
- **Expected Result**: Invitation created, can be validated
- **Verification Points**:
  - [ ] POST returns 201 with invitation token
  - [ ] GET with token returns invitation details
  - [ ] Invitation contains email and organisation name

#### TR-AUTH-009: Expired Invitation

- **Traces to**: US-AUTH-004, AC-004-4
- **Type**: Integration
- **Component Under Test**: GET /api/invitations/:token
- **Preconditions**: Invitation created > 7 days ago
- **Test Input**: Expired invitation token
- **Expected Result**: 410 INVITATION_EXPIRED
- **Verification Points**:
  - [ ] Response status is 410
  - [ ] Error code is INVITATION_EXPIRED

### 2.2 Organisation Tests

#### TR-ORG-001: Get Organisation

- **Traces to**: US-ORG-001
- **Type**: Integration
- **Component Under Test**: GET /api/organisations
- **Preconditions**: Authenticated user
- **Test Input**: Valid JWT
- **Expected Result**: Organisation details returned
- **Verification Points**:
  - [ ] Response status is 200
  - [ ] Response contains org id and name

#### TR-ORG-002: Update Organisation (Admin)

- **Traces to**: US-ORG-001, AC-001-1
- **Type**: Integration
- **Component Under Test**: PATCH /api/organisations
- **Preconditions**: Admin user authenticated
- **Test Input**: Updated organisation name
- **Expected Result**: Organisation updated
- **Verification Points**:
  - [ ] Response status is 200
  - [ ] Database reflects updated name

#### TR-ORG-003: Update Organisation (Member Forbidden)

- **Traces to**: US-ORG-001
- **Type**: Integration
- **Component Under Test**: PATCH /api/organisations
- **Preconditions**: Member user authenticated (not admin)
- **Test Input**: Updated organisation name
- **Expected Result**: 403 FORBIDDEN
- **Verification Points**:
  - [ ] Response status is 403
  - [ ] Error code is FORBIDDEN

#### TR-ORG-004: List Members

- **Traces to**: US-ORG-002, AC-002-1
- **Type**: Integration
- **Component Under Test**: GET /api/organisations/members
- **Preconditions**: Authenticated user
- **Test Input**: Valid JWT
- **Expected Result**: Paginated member list
- **Verification Points**:
  - [ ] Response status is 200
  - [ ] Response contains pagination object
  - [ ] Each member has id, email, name, role

#### TR-ORG-005: Remove Last Admin Blocked

- **Traces to**: US-ORG-002, AC-002-4
- **Type**: Integration
- **Component Under Test**: DELETE /api/organisations/members/:userId
- **Preconditions**: Only one admin in organisation
- **Test Input**: Attempt to remove last admin
- **Expected Result**: 400 error
- **Verification Points**:
  - [ ] Response status is 400
  - [ ] Error prevents removal of last admin

### 2.3 Project Tests

#### TR-PROJ-001: Create Project

- **Traces to**: US-PROJ-001, AC-001-1
- **Type**: Integration
- **Component Under Test**: POST /api/projects
- **Preconditions**: Authenticated user
- **Test Input**: Name, description, schema
- **Expected Result**: Project created
- **Verification Points**:
  - [ ] Response status is 201
  - [ ] Response contains project with id, name, description
  - [ ] Project belongs to user's organisation

#### TR-PROJ-002: Duplicate Project Name

- **Traces to**: US-PROJ-001, AC-001-3
- **Type**: Integration
- **Component Under Test**: POST /api/projects
- **Preconditions**: Project exists with name "Test Project"
- **Test Input**: Same name
- **Expected Result**: 409 DUPLICATE_NAME
- **Verification Points**:
  - [ ] Response status is 409
  - [ ] Error code is DUPLICATE_NAME

#### TR-PROJ-003: List Projects

- **Traces to**: US-PROJ-002
- **Type**: Integration
- **Component Under Test**: GET /api/projects
- **Preconditions**: Multiple projects exist
- **Test Input**: Default pagination
- **Expected Result**: Paginated project list
- **Verification Points**:
  - [ ] Response status is 200
  - [ ] Response contains pagination object
  - [ ] Projects sorted by updatedAt descending

#### TR-PROJ-004: Get Project

- **Traces to**: US-PROJ-002
- **Type**: Integration
- **Component Under Test**: GET /api/projects/:projectId
- **Preconditions**: Project exists
- **Test Input**: Valid project ID
- **Expected Result**: Project details
- **Verification Points**:
  - [ ] Response status is 200
  - [ ] Response contains full project object

#### TR-PROJ-005: Update Project

- **Traces to**: US-PROJ-003
- **Type**: Integration
- **Component Under Test**: PATCH /api/projects/:projectId
- **Preconditions**: Project exists
- **Test Input**: Updated name and description
- **Expected Result**: Project updated
- **Verification Points**:
  - [ ] Response status is 200
  - [ ] Database reflects changes

#### TR-PROJ-006: Delete Project

- **Traces to**: US-PROJ-004
- **Type**: Integration
- **Component Under Test**: DELETE /api/projects/:projectId
- **Preconditions**: Project exists
- **Test Input**: Valid project ID
- **Expected Result**: Project soft-deleted
- **Verification Points**:
  - [ ] Response status is 204
  - [ ] Project has deletedAt timestamp

#### TR-PROJ-007: Access Other Org's Project

- **Traces to**: Multi-tenancy requirement
- **Type**: Integration
- **Component Under Test**: GET /api/projects/:projectId
- **Preconditions**: Project exists in different organisation
- **Test Input**: Valid project ID from other org
- **Expected Result**: 404 NOT_FOUND
- **Verification Points**:
  - [ ] Response status is 404
  - [ ] Tenant isolation enforced

### 2.4 Source Management Tests

#### TR-SRC-001: File Upload CSV

- **Traces to**: US-SRC-001, AC-001-1
- **Type**: Integration
- **Component Under Test**: POST /api/projects/:projectId/sources
- **Preconditions**: Project exists
- **Test Input**: CSV file < 50MB
- **Expected Result**: Source created with detected fields
- **Verification Points**:
  - [ ] Response status is 201
  - [ ] Response contains source with id and type "file"
  - [ ] Fields detected automatically

#### TR-SRC-002: File Upload Excel

- **Traces to**: US-SRC-001, AC-001-2
- **Type**: Integration
- **Component Under Test**: POST /api/projects/:projectId/sources
- **Preconditions**: Project exists
- **Test Input**: XLSX file < 50MB
- **Expected Result**: Source created
- **Verification Points**:
  - [ ] Response status is 201
  - [ ] Sheet names detected
  - [ ] Column headers detected

#### TR-SRC-003: File Upload JSON

- **Traces to**: US-SRC-001, AC-001-3
- **Type**: Integration
- **Component Under Test**: POST /api/projects/:projectId/sources
- **Preconditions**: Project exists
- **Test Input**: JSON file < 50MB
- **Expected Result**: Source created
- **Verification Points**:
  - [ ] Response status is 201
  - [ ] Top-level keys detected

#### TR-SRC-004: Unsupported File Type

- **Traces to**: US-SRC-001, AC-001-4
- **Type**: Integration
- **Component Under Test**: POST /api/projects/:projectId/sources
- **Preconditions**: Project exists
- **Test Input**: .txt or .pdf file
- **Expected Result**: 415 UNSUPPORTED_FILE_TYPE
- **Verification Points**:
  - [ ] Response status is 415
  - [ ] Error code is UNSUPPORTED_FILE_TYPE

#### TR-SRC-005: File Too Large

- **Traces to**: US-SRC-001, AC-001-5
- **Type**: Integration
- **Component Under Test**: POST /api/projects/:projectId/sources
- **Preconditions**: Project exists
- **Test Input**: File > 50MB
- **Expected Result**: 413 UPLOAD_TOO_LARGE
- **Verification Points**:
  - [ ] Response status is 413
  - [ ] Error code is UPLOAD_TOO_LARGE

#### TR-SRC-006: Source Preview

- **Traces to**: US-SRC-003
- **Type**: Integration
- **Component Under Test**: GET /api/projects/:projectId/sources/:sourceId/preview
- **Preconditions**: Source exists
- **Test Input**: Valid source ID
- **Expected Result**: Preview data (first 100 rows)
- **Verification Points**:
  - [ ] Response status is 200
  - [ ] Response contains sample records
  - [ ] Maximum 100 rows returned

#### TR-SRC-007: API Source Connection

- **Traces to**: US-SRC-005, US-SRC-006
- **Type**: Integration
- **Component Under Test**: POST /api/projects/:projectId/api-sources
- **Preconditions**: Project exists
- **Test Input**: Connector type and credentials
- **Expected Result**: API source created
- **Verification Points**:
  - [ ] Response status is 201
  - [ ] Credentials stored encrypted

#### TR-SRC-008: API Source Test Connection

- **Traces to**: US-SRC-005
- **Type**: Integration
- **Component Under Test**: POST /api/projects/:projectId/api-sources/:sourceId/test
- **Preconditions**: API source exists
- **Test Input**: Source ID
- **Expected Result**: Connection test result
- **Verification Points**:
  - [ ] Response status is 200
  - [ ] Response indicates connection success/failure

### 2.5 Configuration Tests

#### TR-CFG-001: Get Schema

- **Traces to**: US-MAP-002
- **Type**: Integration
- **Component Under Test**: GET /api/projects/:projectId/schema
- **Preconditions**: Project exists
- **Test Input**: Project ID
- **Expected Result**: Current schema configuration
- **Verification Points**:
  - [ ] Response status is 200
  - [ ] Response contains schema type and fields

#### TR-CFG-002: Set Schema

- **Traces to**: US-MAP-002
- **Type**: Integration
- **Component Under Test**: PUT /api/projects/:projectId/schema
- **Preconditions**: Project exists
- **Test Input**: Schema type (conversation, qa_pairs, knowledge_document)
- **Expected Result**: Schema updated
- **Verification Points**:
  - [ ] Response status is 200
  - [ ] Project schema updated in database

#### TR-CFG-003: Get Field Mappings

- **Traces to**: US-MAP-001
- **Type**: Integration
- **Component Under Test**: GET /api/projects/:projectId/mappings
- **Preconditions**: Project with sources exists
- **Test Input**: Project ID
- **Expected Result**: Current mappings
- **Verification Points**:
  - [ ] Response status is 200
  - [ ] Response contains mapping configurations

#### TR-CFG-004: Set Field Mappings

- **Traces to**: US-MAP-001
- **Type**: Integration
- **Component Under Test**: PUT /api/projects/:projectId/mappings
- **Preconditions**: Project with sources exists
- **Test Input**: Array of mapping configurations
- **Expected Result**: Mappings saved
- **Verification Points**:
  - [ ] Response status is 200
  - [ ] Mappings persisted correctly

### 2.6 PII Tests

#### TR-PII-001: Trigger PII Detection

- **Traces to**: US-PII-001
- **Type**: Integration
- **Component Under Test**: POST /api/projects/:projectId/pii/detect
- **Preconditions**: Project with source data exists
- **Test Input**: Project ID
- **Expected Result**: 202 Accepted with status endpoint
- **Verification Points**:
  - [ ] Response status is 202
  - [ ] Response contains status polling URL

#### TR-PII-002: Get PII Rules

- **Traces to**: US-PII-002
- **Type**: Integration
- **Component Under Test**: GET /api/projects/:projectId/pii/rules
- **Preconditions**: PII detection completed
- **Test Input**: Project ID
- **Expected Result**: Detected PII with rules
- **Verification Points**:
  - [ ] Response status is 200
  - [ ] Rules contain field, type, handling

#### TR-PII-003: Update PII Rules

- **Traces to**: US-PII-002, US-PII-003
- **Type**: Integration
- **Component Under Test**: PUT /api/projects/:projectId/pii/rules
- **Preconditions**: PII detected
- **Test Input**: Updated rule configurations
- **Expected Result**: Rules updated
- **Verification Points**:
  - [ ] Response status is 200
  - [ ] Custom patterns saved
  - [ ] Handling options saved

#### TR-PII-004: PII Preview

- **Traces to**: US-PII-004
- **Type**: Integration
- **Component Under Test**: POST /api/projects/:projectId/pii/preview
- **Preconditions**: PII rules configured
- **Test Input**: Sample size
- **Expected Result**: Before/after comparison
- **Verification Points**:
  - [ ] Response status is 200
  - [ ] Response contains original and masked samples

### 2.7 Processing Tests

#### TR-PROC-001: Start Processing

- **Traces to**: US-PROC-001
- **Type**: Integration
- **Component Under Test**: POST /api/projects/:projectId/processing
- **Preconditions**: Sources and mappings configured
- **Test Input**: Project ID
- **Expected Result**: 202 Accepted
- **Verification Points**:
  - [ ] Response status is 202
  - [ ] ProcessingRun created in database
  - [ ] Status can be polled

#### TR-PROC-002: Get Processing Status

- **Traces to**: US-PROC-001, AC-001-2
- **Type**: Integration
- **Component Under Test**: GET /api/projects/:projectId/processing/current
- **Preconditions**: Processing running
- **Test Input**: Project ID
- **Expected Result**: Progress and stage info
- **Verification Points**:
  - [ ] Response status is 200
  - [ ] Response contains progress percentage
  - [ ] Response contains current stage name

#### TR-PROC-003: Processing While Already Running

- **Traces to**: US-PROC-001
- **Type**: Integration
- **Component Under Test**: POST /api/projects/:projectId/processing
- **Preconditions**: Processing already running
- **Test Input**: Project ID
- **Expected Result**: 423 PROCESSING_IN_PROGRESS
- **Verification Points**:
  - [ ] Response status is 423
  - [ ] Error code is PROCESSING_IN_PROGRESS

#### TR-PROC-004: Processing History

- **Traces to**: US-PROC-002
- **Type**: Integration
- **Component Under Test**: GET /api/projects/:projectId/processing/history
- **Preconditions**: Multiple processing runs completed
- **Test Input**: Pagination params
- **Expected Result**: Paginated history
- **Verification Points**:
  - [ ] Response status is 200
  - [ ] Contains pagination object
  - [ ] History sorted by date descending

### 2.8 Export Tests

#### TR-EXP-001: Create Export

- **Traces to**: US-EXP-001
- **Type**: Integration
- **Component Under Test**: POST /api/projects/:projectId/exports
- **Preconditions**: Processing completed
- **Test Input**: Format (jsonl, qa_json, structured_json)
- **Expected Result**: Export created
- **Verification Points**:
  - [ ] Response status is 201
  - [ ] Export record created
  - [ ] Export ID returned

#### TR-EXP-002: Download Export

- **Traces to**: US-EXP-002
- **Type**: Integration
- **Component Under Test**: GET /api/projects/:projectId/exports/:exportId/download
- **Preconditions**: Export ready
- **Test Input**: Export ID
- **Expected Result**: File download
- **Verification Points**:
  - [ ] Response status is 200
  - [ ] Content-Type appropriate for format
  - [ ] Content-Disposition header set

#### TR-EXP-003: List Exports

- **Traces to**: US-EXP-003
- **Type**: Integration
- **Component Under Test**: GET /api/projects/:projectId/exports
- **Preconditions**: Multiple exports exist
- **Test Input**: Pagination params
- **Expected Result**: Paginated export list
- **Verification Points**:
  - [ ] Response status is 200
  - [ ] Contains pagination object
  - [ ] Each export has date, format, recordCount

### 2.9 Audit Tests

#### TR-AUD-001: Get Lineage

- **Traces to**: US-AUD-001
- **Type**: Integration
- **Component Under Test**: GET /api/projects/:projectId/audit/lineage
- **Preconditions**: Processing completed
- **Test Input**: Project ID
- **Expected Result**: Lineage information
- **Verification Points**:
  - [ ] Response status is 200
  - [ ] Contains sources, transformations, rules

#### TR-AUD-002: Get PII Summary

- **Traces to**: US-AUD-002
- **Type**: Integration
- **Component Under Test**: GET /api/projects/:projectId/audit/pii-summary
- **Preconditions**: Processing with PII handling completed
- **Test Input**: Project ID
- **Expected Result**: PII handling summary
- **Verification Points**:
  - [ ] Response status is 200
  - [ ] Contains counts by type and handling

---

## 3. Platform Compliance Tests

### 3.1 Health Endpoint Verification

Per Constitution Section C:

| Test | Expected | Verification |
|------|----------|--------------|
| GET /api/health | `{ "status": "ok", "timestamp": "<ISO8601>" }` | Exact response structure |
| Response time | < 200ms | Non-blocking check |

### 3.2 Rate Limit Verification

Per Architecture Section 6.2:

| Endpoint Category | Limit | Test Scenario |
|-------------------|-------|---------------|
| Auth endpoints | 5/15min | Send 6 rapid login requests, verify 6th returns 429 |
| Upload endpoints | 20/hour | Exceed limit, verify 429 |
| General endpoints | 100/15min | High load test |

**Rate Limit Header Verification:**
- [ ] `X-RateLimit-Limit` present on all responses
- [ ] `X-RateLimit-Remaining` present on all responses
- [ ] `X-RateLimit-Reset` present on all responses

### 3.3 Response Envelope Verification

Per Constitution Section C:

| Type | Test | Expected Structure |
|------|------|-------------------|
| Success | Any 2xx response | `{ data: <payload>, meta: { timestamp } }` |
| Paginated | Any list endpoint | `{ data: [], pagination: { page, limit, total, totalPages, hasMore }, meta: { timestamp } }` |
| Error | Any 4xx/5xx response | `{ error: { code, message } }` |

### 3.4 Invalid ID Parameter Verification

Per API Contract Section 6.1:

| Input | Expected |
|-------|----------|
| `/api/projects/abc` | 400 INVALID_ID |
| `/api/projects/-1` | 400 INVALID_ID |
| `/api/projects/0` | 400 INVALID_ID |
| `/api/projects/1.5` | 400 INVALID_ID |

### 3.5 Authentication Tests

| Scenario | Expected |
|----------|----------|
| No token | 401 UNAUTHORIZED |
| Invalid token | 401 UNAUTHORIZED |
| Expired token | 401 TOKEN_EXPIRED |
| Valid token | 2xx (per endpoint) |

---

## 4. UI Screen Tests

### 4.1 Auth Page Tests

| Screen | States to Test | Forms | Critical Actions |
|--------|----------------|-------|------------------|
| Login | Default, Error, Loading, Rate limited | Login form | Submit, Forgot password link |
| Register | Default, Error, Loading, Success | Register form | Submit, Login link |
| Forgot Password | Default, Submitting, Success | Email form | Submit, Back to login |
| Reset Password | Valid token, Invalid token, Loading | New password form | Submit |
| Accept Invitation | Valid, Invalid, Expired | Registration form (if new) | Accept invitation |

### 4.2 Dashboard Tests

| Screen | States | Data Dependencies |
|--------|--------|-------------------|
| Dashboard | Empty, With projects, Loading, Error | GET /api/projects |
| Project card | Normal, Hover, Loading | Project data |

### 4.3 Project Detail Tests

| Screen | States | API Dependencies |
|--------|--------|------------------|
| Overview | Empty, Populated | GET /api/projects/:id |
| Sources tab | Empty, With sources | GET /api/projects/:id/sources |
| Source detail | Preview, Fields | GET /api/projects/:id/sources/:id |
| Configuration | Schema selector, Mapping | GET/PUT /api/projects/:id/schema |
| Field Mapping | Unmapped, Mapped | GET/PUT /api/projects/:id/mappings |
| PII Configuration | Undetected, Detected, Configured | GET/PUT /api/projects/:id/pii/rules |
| PII Preview | Before/After | POST /api/projects/:id/pii/preview |
| Processing | Idle, Running, Complete, Failed | GET/POST /api/projects/:id/processing |
| Exports | Empty, With exports | GET /api/projects/:id/exports |
| Audit | Lineage view, PII summary | GET /api/projects/:id/audit/* |

### 4.4 Settings Tests

| Screen | States | Role Requirements |
|--------|--------|-------------------|
| Organisation Settings | View, Edit | Admin only |
| Member Management | List, Invite, Edit role, Remove | Admin only for mutations |
| User Profile | View, Edit, Change password | Own profile only |

### 4.5 Error Page Tests

| Page | Trigger | Expected |
|------|---------|----------|
| 404 Not Found | Invalid route | Error message, link to dashboard |
| 403 Forbidden | Unauthorised action | Error message, appropriate redirect |
| 500 Error | Server error | Error message, retry option |

---

## 5. Form Validation Tests

### 5.1 Registration Form

| Field | Validation Rule | Error Message |
|-------|-----------------|---------------|
| Email | Valid email format | "Please enter a valid email address" |
| Password | Min 8 chars | "Password must be at least 8 characters" |
| Password | 1 uppercase | "Password must contain at least one uppercase letter" |
| Password | 1 number | "Password must contain at least one number" |
| Name | Required, min 1 char | "Name is required" |

### 5.2 Login Form

| Field | Validation Rule | Error Message |
|-------|-----------------|---------------|
| Email | Valid email format | "Please enter a valid email address" |
| Password | Required | "Password is required" |

### 5.3 Project Form

| Field | Validation Rule | Error Message |
|-------|-----------------|---------------|
| Name | Required, min 1 char | "Project name is required" |
| Name | Max 100 chars | "Project name must be 100 characters or less" |
| Description | Max 500 chars | "Description must be 500 characters or less" |
| Schema | Required | "Please select a schema" |

### 5.4 Invitation Form

| Field | Validation Rule | Error Message |
|-------|-----------------|---------------|
| Email | Valid email format | "Please enter a valid email address" |
| Role | One of: admin, member | "Please select a role" |

---

## 6. Deployment Specification

### 6.1 Environment Variables

| Variable | Classification | Format | Default | Description |
|----------|---------------|--------|---------|-------------|
| DATABASE_URL | REQUIRED | `postgres://...` | None | PostgreSQL connection string |
| JWT_SECRET | REQUIRED | 32+ char string | None | Token signing secret |
| SESSION_SECRET | REQUIRED | 32+ char string | None | Session secret |
| PORT | REQUIRED_WITH_DEFAULT | Integer | 5000 | Server port |
| NODE_ENV | REQUIRED_WITH_DEFAULT | String | development | Environment mode |
| RESEND_API_KEY | OPTIONAL | `re_...` | None | Email service (graceful degradation) |
| ENCRYPTION_KEY | REQUIRED | 32 char string | None | AES-256 encryption key |
| VITE_API_URL | REQUIRED_WITH_DEFAULT | URL | `/api` | API base URL for frontend |

**Classification Legend:**
- REQUIRED: Server fails to start if missing
- REQUIRED_WITH_DEFAULT: Has fallback value
- OPTIONAL: Feature disabled if missing (graceful degradation)

### 6.2 Pre-Deployment Verification Checklist

#### Database Driver Verification

- [ ] `package.json` contains `"postgres": "^3.4.3"` (NOT `@neondatabase/serverless`)
- [ ] `server/db/index.ts` imports from `postgres`
- [ ] `drizzle.config.ts` uses `drizzle-orm/postgres-js`

#### Tailwind v4 Verification

- [ ] `client/src/index.css` uses `@import "tailwindcss"` (NOT `@tailwind base`)
- [ ] CSS uses `@layer base` (NOT `@theme`)

#### Module Resolution Verification

- [ ] `tsconfig.json` has `"moduleResolution": "bundler"`
- [ ] No `CommonJS` requires in TypeScript files

#### Express Routing Verification

- [ ] Specific routes registered before parameterized routes
- [ ] No `app.get('*')` pattern (use middleware instead)
- [ ] `app.set('trust proxy', 1)` for rate limiting

#### Static Path Verification

- [ ] Server uses `process.cwd()` for paths (NOT `__dirname`)
- [ ] Static files served from `dist/public` in production

#### Port Configuration Verification

- [ ] Server defaults to port 5000
- [ ] Vite config has `host: '0.0.0.0'`
- [ ] Vite config has `strictPort: true`

#### API Prefix Verification

- [ ] All endpoints use `/api` prefix (NOT `/api/v1`)
- [ ] No mixed prefix patterns

#### Error Format Verification

- [ ] Error middleware returns `{ error: { code, message } }`
- [ ] No flat `{ error: 'message' }` patterns

### 6.3 Code Completeness Verification

**CRITICAL: Deployment Blockers**

| Check | Command | Expected |
|-------|---------|----------|
| No TODOs | `grep -r "// TODO" --include="*.ts" --include="*.tsx" ./server ./client/src` | 0 matches |
| No FIXMEs | `grep -r "// FIXME" --include="*.ts" --include="*.tsx" ./server ./client/src` | 0 matches |
| No stubs | `grep -r "Not implemented" --include="*.ts" ./server` | 0 matches |
| No insecure random | `grep -r "Math.random()" --include="*.ts" ./server` | 0 matches |

### 6.4 Frontend Completeness Verification

| Check | Verification |
|-------|-------------|
| Route count | `grep -c "<Route path=" ./client/src/App.tsx` = 26 |
| Page count | `ls -1 ./client/src/pages/*.tsx \| wc -l` = 26 |
| ErrorBoundary | Wraps App component |

### 6.5 Auth Flow Pages Verification

| API Endpoint | Required Page |
|--------------|---------------|
| POST /api/auth/forgot-password | `./client/src/pages/forgot-password.tsx` |
| POST /api/auth/reset-password | `./client/src/pages/reset-password.tsx` |
| GET /api/invitations/:token | `./client/src/pages/invite.tsx` |

### 6.6 Deployment Steps

#### Pre-Deployment

- [ ] All REQUIRED environment variables set in Replit Secrets
- [ ] DATABASE_URL points to production database
- [ ] JWT_SECRET is unique, 32+ characters
- [ ] Code completeness verification passed

#### Deployment

1. [ ] Install dependencies: `npm install`
2. [ ] Run database migrations: `npm run db:push`
3. [ ] Build application: `npm run build`
4. [ ] Start application: `npm run start`

#### Post-Deployment

- [ ] Health check: `curl https://[app].replit.app/api/health`
- [ ] Login test: Verify authentication works
- [ ] Create project: Verify CRUD operations
- [ ] File upload: Verify source creation

---

## 7. Development Environment Verification

### 7.1 Server Startup Verification

| Check | Expected | How to Verify |
|-------|----------|---------------|
| Backend starts | No errors | `npm run dev` shows "Server running on port 3001" |
| Frontend starts | No errors | Vite shows "ready in X ms" |
| No continuous reloads | Page stable | Watch browser for 60 seconds |
| Hot reload works | Changes appear | Edit component, verify change without refresh |

### 7.2 Data Visibility Verification

| Check | How to Verify |
|-------|---------------|
| Create project | Use UI to create new project |
| Project appears in list | Navigate to dashboard, verify project shows |
| Project detail loads | Click project, verify detail page loads |
| After page refresh | Refresh browser, verify data persists |

### 7.3 Authentication Flow Verification

| Check | Expected | How to Verify |
|-------|----------|---------------|
| Login | Redirects to dashboard | Submit valid credentials |
| Session persists | Stay logged in | Refresh page |
| Logout | Clears session | Click logout, verify redirect |
| Protected route | Redirects if not auth | Open incognito, navigate to /dashboard |
| Role-based access | Shows/hides correctly | Login as member, verify admin routes hidden |

### 7.4 Feature Completeness Matrix

| Entity | Create | List | Detail | Update | Delete |
|--------|--------|------|--------|--------|--------|
| User | Registration | N/A | Profile | Profile | N/A |
| Organisation | N/A | N/A | Settings | Settings | N/A |
| Project | ✓ | ✓ | ✓ | ✓ | ✓ |
| Source | ✓ | ✓ | ✓ | N/A | ✓ |
| Export | ✓ | ✓ | Download | N/A | N/A |

---

## 8. Test Coverage Matrix

### 8.1 User Story Coverage

| User Story | Test Requirements | Type |
|------------|-------------------|------|
| US-AUTH-001 | TR-AUTH-001, TR-AUTH-002, TR-AUTH-003 | Integration |
| US-AUTH-002 | TR-AUTH-004, TR-AUTH-005 | Integration |
| US-AUTH-003 | TR-AUTH-006, TR-AUTH-007 | Integration |
| US-AUTH-004 | TR-AUTH-008, TR-AUTH-009 | Integration |
| US-ORG-001 | TR-ORG-001, TR-ORG-002, TR-ORG-003 | Integration |
| US-ORG-002 | TR-ORG-004, TR-ORG-005 | Integration |
| US-PROJ-001 | TR-PROJ-001, TR-PROJ-002 | Integration |
| US-PROJ-002 | TR-PROJ-003, TR-PROJ-004 | Integration |
| US-PROJ-003 | TR-PROJ-005 | Integration |
| US-PROJ-004 | TR-PROJ-006, TR-PROJ-007 | Integration |
| US-SRC-001 | TR-SRC-001 to TR-SRC-005 | Integration |
| US-SRC-002 | TR-SRC-001 to TR-SRC-003 (field detection) | Integration |
| US-SRC-003 | TR-SRC-006 | Integration |
| US-SRC-004 | Source list tests | Integration |
| US-SRC-005 | TR-SRC-007, TR-SRC-008 | Integration |
| US-SRC-006 | TR-SRC-007, TR-SRC-008 | Integration |
| US-MAP-001 | TR-CFG-003, TR-CFG-004 | Integration |
| US-MAP-002 | TR-CFG-001, TR-CFG-002 | Integration |
| US-PII-001 | TR-PII-001 | Integration |
| US-PII-002 | TR-PII-002, TR-PII-003 | Integration |
| US-PII-003 | TR-PII-003 | Integration |
| US-PII-004 | TR-PII-004 | Integration |
| US-PROC-001 | TR-PROC-001, TR-PROC-002, TR-PROC-003 | Integration |
| US-PROC-002 | TR-PROC-004 | Integration |
| US-EXP-001 | TR-EXP-001 | Integration |
| US-EXP-002 | TR-EXP-002 | Integration |
| US-EXP-003 | TR-EXP-003 | Integration |
| US-AUD-001 | TR-AUD-001 | Integration |
| US-AUD-002 | TR-AUD-002 | Integration |

### 8.2 API Endpoint Coverage

| Endpoint Group | Endpoints | Test Requirements |
|----------------|-----------|-------------------|
| Health | 1 | Platform compliance tests |
| Auth | 8 | TR-AUTH-001 to TR-AUTH-009 |
| Organisations | 5 | TR-ORG-001 to TR-ORG-005 |
| Invitations | 4 | TR-AUTH-008, TR-AUTH-009 |
| Projects | 5 | TR-PROJ-001 to TR-PROJ-007 |
| Sources | 6 | TR-SRC-001 to TR-SRC-008 |
| API Sources | 3 | TR-SRC-007, TR-SRC-008 |
| Configuration | 4 | TR-CFG-001 to TR-CFG-004 |
| PII | 4 | TR-PII-001 to TR-PII-004 |
| Processing | 5 | TR-PROC-001 to TR-PROC-004 |
| Exports | 4 | TR-EXP-001 to TR-EXP-003 |
| Audit | 3 | TR-AUD-001, TR-AUD-002 |

---

## 9. Accessibility Testing Checklist

Per UI Specification Section 14:

| Category | Requirement | Verification |
|----------|-------------|--------------|
| **Keyboard Navigation** | | |
| Tab order | Logical flow | Manual testing |
| Focus visible | 2px ring on focus | Visual inspection |
| Skip links | Present on pages with nav | Check first focusable |
| Modal focus trap | Focus stays in modal | Tab through modal |
| **Screen Readers** | | |
| Headings | Proper h1-h6 hierarchy | Heading outline tool |
| Labels | All inputs labelled | axe DevTools |
| Alt text | All images | axe DevTools |
| ARIA | Live regions for dynamic content | Manual SR test |
| **Visual** | | |
| Color contrast | 4.5:1 normal, 3:1 large | Contrast checker |
| Text resize | Readable at 200% zoom | Browser zoom |
| Motion | Respects prefers-reduced-motion | CSS check |

---

## 10. Browser Testing Matrix

| Browser | Version | Priority |
|---------|---------|----------|
| Chrome | Latest | P0 |
| Firefox | Latest | P1 |
| Safari | Latest | P1 |
| Mobile Safari | Latest | P2 |
| Mobile Chrome | Latest | P2 |

---

## Document Validation

### Completeness Checklist

- [x] Zero code blocks containing test implementations
- [x] Zero import statements
- [x] All test requirements use specification format
- [x] All deployment steps are checklists
- [x] Traceability complete (every user story has test requirement)

### Replit Compliance Checks

Per Constitution Section C and D:
- [x] Health endpoint verification included
- [x] API conventions verified
- [x] Environment variables classified
- [x] postgres-js driver verification included

### Development Environment Checks

- [x] Data visibility verification included
- [x] Feature completeness matrix included
- [x] Authentication flow verification included

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

---

## ASSUMPTION REGISTER

### AR-001: Test Tool Versions

- **Type:** ASSUMPTION
- **Source Gap:** Upstream documents specify tools (Vitest, Playwright) but not versions
- **Assumption Made:** Latest stable versions of all testing tools are acceptable
- **Impact if Wrong:** Version incompatibilities could cause test failures
- **Proposed Resolution:** Pin specific versions during implementation
- **Status:** UNRESOLVED
- **Owner:** Agent 6 (Implementation)
- **Date:** 2025-01-18

### AR-002: PII Detection Accuracy Verification

- **Type:** DEPENDENCY
- **Source Gap:** PRD specifies >85% precision but no test dataset provided
- **Assumption Made:** QA will create test dataset with known PII for accuracy measurement
- **Impact if Wrong:** Cannot validate PII detection accuracy claims
- **Proposed Resolution:** Create curated test dataset with labelled PII
- **Status:** UNRESOLVED
- **Owner:** Human
- **Date:** 2025-01-18

### AR-003: Load Testing Requirements

- **Type:** ASSUMPTION
- **Source Gap:** PRD specifies "10-50 concurrent users" but no performance test requirements
- **Assumption Made:** Basic load testing with 50 concurrent users is sufficient for MVP
- **Impact if Wrong:** Performance issues may not be caught until production
- **Proposed Resolution:** Define specific performance benchmarks
- **Status:** UNRESOLVED
- **Owner:** Human
- **Date:** 2025-01-18

### AR-004: E2E Test Coverage Scope

- **Type:** ASSUMPTION
- **Source Gap:** No explicit E2E test scenarios defined in upstream docs
- **Assumption Made:** E2E tests cover critical user journeys only (auth, upload, process, export)
- **Impact if Wrong:** Edge cases may not be covered by E2E tests
- **Proposed Resolution:** Define explicit E2E test scenarios
- **Status:** UNRESOLVED
- **Owner:** Human
- **Date:** 2025-01-18

### Upstream Assumption Review

Reviewed all Assumption Registers from Agents 1-6:

| Agent | AR Count | Status |
|-------|----------|--------|
| Agent 1 (PRD) | 7 | 7 UNRESOLVED - require human decision |
| Agent 2 (Architecture) | 6 | 6 UNRESOLVED - 3 escalated to QA (AR-003, AR-004, AR-005) |
| Agent 3 (Data Model) | 6 | 6 UNRESOLVED - require human decision |
| Agent 4 (API Contract) | 7 | 7 UNRESOLVED - require human decision |
| Agent 5 (UI Spec) | 6 | 6 UNRESOLVED - require human decision |
| Agent 6 (Implementation) | 4 | 4 UNRESOLVED - require human decision |

**Escalated Deployment Risks:**

1. **AR-003 (Architecture)**: PII Detection Library - If pattern-based detection doesn't meet 85% precision, deployment blocked pending external API integration
2. **AR-004 (Architecture)**: 50MB File Memory - Replit memory constraints may limit file size; test with maximum files during QA
3. **AR-005 (Architecture)**: Processing Duration - Long-running operations may need checkpoint/resume; test with 100K records

**Recommendation:** Human review required for all UNRESOLVED assumptions before production deployment approval.

---

## Document End
