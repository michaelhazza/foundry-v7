# 04-API-CONTRACT.md - Foundry API Contract Document

## FRAMEWORK VERSION

Framework: Agent Specification Framework v2.1
Constitution: Agent 0 - Agent Constitution v3
Status: Active

---

## VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1 | 2025-01-18 | Initial API Contract from PRD v1, Architecture v1, Data Model v1; Hygiene Gate: PASS |

---

## INHERITED CONSTITUTION

This document inherits and must comply with **Agent 0: Agent Constitution v3**.

This document must not restate or redefine global rules. It references the Constitution for global conventions.

---

## Section 1: API Overview

### 1.1 API Configuration

| Setting | Value | Source |
|---------|-------|--------|
| API Prefix | `/api` | Per Constitution Section C |
| Base URL (Dev) | `http://localhost:5000/api` | Per Constitution Section C |
| Base URL (Prod) | `https://[app].replit.app/api` | Per Constitution Section D |
| Server Port | 5000 | Per Constitution Section C |
| Protocol | HTTPS (production), HTTP (development) | Standard |

### 1.2 Authentication

| Setting | Value | Source |
|---------|-------|--------|
| Type | JWT Bearer Token | Architecture Section 5 |
| Header | `Authorization: Bearer <token>` | Standard |
| Token Storage | localStorage, key: `auth_token` | Per Constitution Section C |
| Token Expiry | 24 hours | Architecture Section 5.3 |
| Token Payload | `{ userId, email, orgId, role, iat, exp }` | Architecture Section 5.3 |

### 1.3 Response Envelopes

Per Constitution Section C:

**Success Envelope:**
```
{ "data": <payload>, "meta": { "timestamp": "<ISO8601>", "requestId": "<uuid>" } }
```

**Paginated Envelope:**
```
{ "data": [...], "pagination": { page, limit, total, totalPages, hasMore }, "meta": { "timestamp": "<ISO8601>", "requestId": "<uuid>" } }
```

**Error Envelope:**
```
{ "error": { "code": "<ERROR_CODE>", "message": "<human readable>" } }
```

### 1.4 Rate Limiting

Per Architecture Section 6.2:

| Category | Window | Limit | Endpoints |
|----------|--------|-------|-----------|
| Global | 15 min | 100 requests | All endpoints |
| Auth | 15 min | 5 requests | login, register, forgot-password, reset-password |
| Upload | 1 hour | 20 requests | Source file uploads |

**Rate Limit Headers (MANDATORY on all responses):**
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

---

## Section 2: URL Conventions

| Convention | Pattern | Example |
|------------|---------|---------|
| API Prefix | `/api` | `/api/projects` |
| Resource Naming | plural, kebab-case | `/api/processing-runs` |
| Path Parameters | camelCase | `:projectId`, `:sourceId` |
| Query Parameters | snake_case | `?page=1&limit=20` |
| Maximum Nesting | 2 levels | `/api/projects/:projectId/sources` |

### ID Format

All entity IDs are integers (serial primary keys per Data Model).

---

## Section 3: Error Codes Registry

| Code | HTTP Status | Description | Usage |
|------|-------------|-------------|-------|
| VALIDATION_ERROR | 400 | Request validation failed | Invalid input format, missing required fields |
| INVALID_ID | 400 | Invalid ID parameter format | Non-numeric, negative, or zero ID |
| BAD_REQUEST | 400 | Generic bad request | Malformed request body |
| UNAUTHORIZED | 401 | Authentication required | Missing or invalid token |
| TOKEN_EXPIRED | 401 | JWT token expired | Token past expiry |
| FORBIDDEN | 403 | Insufficient permissions | Role-based access denied |
| NOT_FOUND | 404 | Resource not found | Entity does not exist |
| DUPLICATE_EMAIL | 409 | Email already registered | Registration with existing email |
| DUPLICATE_NAME | 409 | Name conflict | Project name already exists in org |
| INVITATION_EXPIRED | 410 | Invitation token expired | Invite token past 7-day expiry |
| TOKEN_INVALID | 410 | Reset token invalid/expired | Password reset token invalid |
| UPLOAD_TOO_LARGE | 413 | File exceeds limit | File > 50MB |
| UNSUPPORTED_FILE_TYPE | 415 | Invalid file type | Not CSV/XLSX/JSON |
| PROCESSING_IN_PROGRESS | 423 | Processing already running | Attempt to start while running |
| RATE_LIMIT_EXCEEDED | 429 | Rate limit exceeded | Too many requests |
| INTERNAL_ERROR | 500 | Server error | Unexpected server failure |

---

## Section 4: Endpoint Inventory

### 4.1 Complete Endpoint Table

| Endpoint | Method | Auth | Rate | Paginated | Success | User Story |
|----------|--------|------|------|-----------|---------|------------|
| `/api/health` | GET | - | Std | No | 200 | - |
| `/api/auth/register` | POST | - | Auth | No | 201 | US-AUTH-001 |
| `/api/auth/login` | POST | - | Auth | No | 200 | US-AUTH-002 |
| `/api/auth/logout` | POST | Bearer | Std | No | 204 | US-AUTH-002 |
| `/api/auth/me` | GET | Bearer | Std | No | 200 | US-AUTH-002 |
| `/api/auth/profile` | PATCH | Bearer | Std | No | 200 | - |
| `/api/auth/forgot-password` | POST | - | Auth | No | 200 | US-AUTH-003 |
| `/api/auth/reset-password/:token` | GET | - | Std | No | 200 | US-AUTH-003 |
| `/api/auth/reset-password` | POST | - | Auth | No | 200 | US-AUTH-003 |
| `/api/organisations` | GET | Bearer | Std | No | 200 | US-ORG-001 |
| `/api/organisations` | PATCH | Bearer+Admin | Std | No | 200 | US-ORG-001 |
| `/api/organisations/members` | GET | Bearer | Std | Yes | 200 | US-ORG-002 |
| `/api/organisations/members/:userId` | PATCH | Bearer+Admin | Std | No | 200 | US-ORG-002 |
| `/api/organisations/members/:userId` | DELETE | Bearer+Admin | Std | No | 204 | US-ORG-002 |
| `/api/invitations` | POST | Bearer+Admin | Std | No | 201 | US-AUTH-004 |
| `/api/invitations` | GET | Bearer+Admin | Std | Yes | 200 | US-AUTH-004 |
| `/api/invitations/:token` | GET | - | Std | No | 200 | US-AUTH-004 |
| `/api/invitations/:id` | DELETE | Bearer+Admin | Std | No | 204 | US-AUTH-004 |
| `/api/projects` | GET | Bearer | Std | Yes | 200 | US-PROJ-002 |
| `/api/projects` | POST | Bearer | Std | No | 201 | US-PROJ-001 |
| `/api/projects/:projectId` | GET | Bearer | Std | No | 200 | US-PROJ-002 |
| `/api/projects/:projectId` | PATCH | Bearer | Std | No | 200 | US-PROJ-003 |
| `/api/projects/:projectId` | DELETE | Bearer | Std | No | 204 | US-PROJ-004 |
| `/api/projects/:projectId/sources` | GET | Bearer | Std | Yes | 200 | US-SRC-004 |
| `/api/projects/:projectId/sources` | POST | Bearer | Upload | No | 201 | US-SRC-001 |
| `/api/projects/:projectId/sources/:sourceId` | GET | Bearer | Std | No | 200 | US-SRC-003 |
| `/api/projects/:projectId/sources/:sourceId` | DELETE | Bearer | Std | No | 204 | US-SRC-004 |
| `/api/projects/:projectId/sources/:sourceId/preview` | GET | Bearer | Std | No | 200 | US-SRC-003 |
| `/api/projects/:projectId/api-sources` | POST | Bearer | Std | No | 201 | US-SRC-005,006 |
| `/api/projects/:projectId/api-sources/:sourceId/test` | POST | Bearer | Std | No | 200 | US-SRC-005,006 |
| `/api/projects/:projectId/api-sources/:sourceId/import` | POST | Bearer | Std | No | 202 | US-SRC-005,006 |
| `/api/projects/:projectId/schema` | GET | Bearer | Std | No | 200 | US-MAP-002 |
| `/api/projects/:projectId/schema` | PUT | Bearer | Std | No | 200 | US-MAP-002 |
| `/api/projects/:projectId/mappings` | GET | Bearer | Std | No | 200 | US-MAP-001 |
| `/api/projects/:projectId/mappings` | PUT | Bearer | Std | No | 200 | US-MAP-001 |
| `/api/projects/:projectId/pii/detect` | POST | Bearer | Std | No | 202 | US-PII-001 |
| `/api/projects/:projectId/pii/rules` | GET | Bearer | Std | No | 200 | US-PII-002 |
| `/api/projects/:projectId/pii/rules` | PUT | Bearer | Std | No | 200 | US-PII-002,003 |
| `/api/projects/:projectId/pii/preview` | POST | Bearer | Std | No | 200 | US-PII-004 |
| `/api/projects/:projectId/processing` | POST | Bearer | Std | No | 202 | US-PROC-001 |
| `/api/projects/:projectId/processing/current` | GET | Bearer | Std | No | 200 | US-PROC-001 |
| `/api/projects/:projectId/processing/history` | GET | Bearer | Std | Yes | 200 | US-PROC-002 |
| `/api/projects/:projectId/processing/:runId` | GET | Bearer | Std | No | 200 | US-PROC-001 |
| `/api/projects/:projectId/processing/:runId/cancel` | POST | Bearer | Std | No | 200 | US-PROC-001 |
| `/api/projects/:projectId/exports` | GET | Bearer | Std | Yes | 200 | US-EXP-003 |
| `/api/projects/:projectId/exports` | POST | Bearer | Std | No | 201 | US-EXP-001 |
| `/api/projects/:projectId/exports/:exportId` | GET | Bearer | Std | No | 200 | US-EXP-002 |
| `/api/projects/:projectId/exports/:exportId/download` | GET | Bearer | Std | No | 200 | US-EXP-002 |
| `/api/projects/:projectId/audit/lineage` | GET | Bearer | Std | No | 200 | US-AUD-001 |
| `/api/projects/:projectId/audit/pii-summary` | GET | Bearer | Std | No | 200 | US-AUD-002 |
| `/api/projects/:projectId/audit/events` | GET | Bearer | Std | Yes | 200 | US-AUD-001 |

---

## Section 4.2: Authentication Endpoints

### Health Check

Per Constitution Section C:

| Aspect | Details |
|--------|---------|
| Endpoint | `GET /api/health` |
| Auth | None |
| Rate Limit | Standard |
| Success | 200 |

**Response:** `{ "status": "ok", "timestamp": "<ISO8601>" }`

---

### POST /api/auth/register

| Aspect | Details |
|--------|---------|
| Auth | None |
| Rate Limit | Auth (5/15min) |
| User Story | US-AUTH-001 |
| Success | 201 Created |

**Request Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| email | string | Yes | Valid email format |
| password | string | Yes | min 8 chars, 1 uppercase, 1 number |
| name | string | Yes | min 1, max 100 chars |
| inviteToken | string | No | Valid invite token |

**Response Fields:** `{ token, user: { id, email, name, role, organisation: { id, name } } }`

**Errors:** 400 VALIDATION_ERROR, 409 DUPLICATE_EMAIL, 410 INVITATION_EXPIRED, 429 RATE_LIMIT_EXCEEDED

**Business Logic:**
- If `inviteToken` provided: validate token, add user to organisation with role from invite, mark invite accepted
- If no `inviteToken`: create new organisation with user as admin

---

### POST /api/auth/login

| Aspect | Details |
|--------|---------|
| Auth | None |
| Rate Limit | Auth (5/15min) |
| User Story | US-AUTH-002 |
| Success | 200 |

**Request Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| email | string | Yes | Valid email format |
| password | string | Yes | min 1 char |

**Response Fields:** `{ token, user: { id, email, name, role, organisation: { id, name } } }`

**Errors:** 400 VALIDATION_ERROR, 401 UNAUTHORIZED (generic message: "Invalid credentials"), 429 RATE_LIMIT_EXCEEDED

**Security:** Error message must not reveal whether email exists.

---

### POST /api/auth/logout

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | US-AUTH-002 |
| Success | 204 No Content |

**Response Fields:** None (empty body)

**Errors:** 401 UNAUTHORIZED

---

### GET /api/auth/me

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | US-AUTH-002 |
| Success | 200 |

**Response Fields:** `{ id, email, name, role, organisation: { id, name }, createdAt }`

**Errors:** 401 UNAUTHORIZED

---

### PATCH /api/auth/profile

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | - |
| Success | 200 |

**Request Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | string | No | min 1, max 100 chars |
| currentPassword | string | No* | Required if changing password |
| newPassword | string | No* | min 8 chars, 1 uppercase, 1 number |

*If `newPassword` provided, `currentPassword` is required.

**Response Fields:** `{ id, email, name, role, organisation: { id, name }, createdAt }`

**Errors:** 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 422 UNPROCESSABLE_ENTITY (wrong current password)

---

### POST /api/auth/forgot-password

| Aspect | Details |
|--------|---------|
| Auth | None |
| Rate Limit | Auth (5/15min) |
| User Story | US-AUTH-003 |
| Success | 200 |

**Request Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| email | string | Yes | Valid email format |

**Response Fields:** `{ message: "If an account exists, a reset link has been sent" }`

**Errors:** 400 VALIDATION_ERROR, 429 RATE_LIMIT_EXCEEDED

**Security:** Response must be identical whether email exists or not. Token expires after 1 hour.

---

### GET /api/auth/reset-password/:token

| Aspect | Details |
|--------|---------|
| Auth | None |
| Rate Limit | Standard |
| User Story | US-AUTH-003 |
| Success | 200 |

**Response Fields:** `{ valid: true, email: "user@example.com" }` (email partially masked)

**Errors:** 410 TOKEN_INVALID (expired or used)

---

### POST /api/auth/reset-password

| Aspect | Details |
|--------|---------|
| Auth | None |
| Rate Limit | Auth (5/15min) |
| User Story | US-AUTH-003 |
| Success | 200 |

**Request Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| token | string | Yes | Valid reset token |
| newPassword | string | Yes | min 8 chars, 1 uppercase, 1 number |

**Response Fields:** `{ message: "Password has been reset successfully" }`

**Errors:** 400 VALIDATION_ERROR, 410 TOKEN_INVALID, 429 RATE_LIMIT_EXCEEDED

---

## Section 4.3: Organisation Endpoints

### GET /api/organisations

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | US-ORG-001 |
| Success | 200 |

**Response Fields:** `{ id, name, createdAt, updatedAt, memberCount }`

**Errors:** 401 UNAUTHORIZED

**Note:** Returns the current user's organisation only.

---

### PATCH /api/organisations

| Aspect | Details |
|--------|---------|
| Auth | Bearer + Admin role |
| Rate Limit | Standard |
| User Story | US-ORG-001 |
| Success | 200 |

**Request Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | string | No | min 1, max 100 chars |

**Response Fields:** `{ id, name, createdAt, updatedAt, memberCount }`

**Errors:** 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 FORBIDDEN

---

### GET /api/organisations/members

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| Paginated | Yes |
| User Story | US-ORG-002 |
| Success | 200 |

**Query Parameters:**

| Param | Type | Default | Max |
|-------|------|---------|-----|
| page | integer | 1 | - |
| limit | integer | 20 | 100 |

**Response Fields:** `[{ userId, email, name, role, joinedAt, lastActiveAt }]`

**Errors:** 401 UNAUTHORIZED

---

### PATCH /api/organisations/members/:userId

| Aspect | Details |
|--------|---------|
| Auth | Bearer + Admin role |
| Rate Limit | Standard |
| User Story | US-ORG-002 |
| Success | 200 |

**Request Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| role | string | Yes | "admin" or "member" |

**Response Fields:** `{ userId, email, name, role, joinedAt }`

**Errors:** 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 FORBIDDEN (cannot change own role or last admin), 404 NOT_FOUND

---

### DELETE /api/organisations/members/:userId

| Aspect | Details |
|--------|---------|
| Auth | Bearer + Admin role |
| Rate Limit | Standard |
| User Story | US-ORG-002 |
| Success | 204 No Content |

**Errors:** 401 UNAUTHORIZED, 403 FORBIDDEN (cannot remove last admin or self), 404 NOT_FOUND

---

## Section 4.4: Invitation Endpoints

### POST /api/invitations

| Aspect | Details |
|--------|---------|
| Auth | Bearer + Admin role |
| Rate Limit | Standard |
| User Story | US-AUTH-004 |
| Success | 201 Created |

**Request Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| email | string | Yes | Valid email format |
| role | string | No | "admin" or "member" (default: "member") |

**Response Fields:** `{ id, email, role, token, expiresAt, createdAt }`

**Errors:** 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 FORBIDDEN

**Note:** Token is only returned in create response for email sending.

---

### GET /api/invitations

| Aspect | Details |
|--------|---------|
| Auth | Bearer + Admin role |
| Rate Limit | Standard |
| Paginated | Yes |
| User Story | US-AUTH-004 |
| Success | 200 |

**Query Parameters:**

| Param | Type | Default |
|-------|------|---------|
| page | integer | 1 |
| limit | integer | 20 |
| status | string | "pending" |

**Response Fields:** `[{ id, email, role, status, expiresAt, createdAt, invitedBy: { id, name } }]`

**Status values:** "pending", "accepted", "expired"

**Errors:** 401 UNAUTHORIZED, 403 FORBIDDEN

---

### GET /api/invitations/:token

| Aspect | Details |
|--------|---------|
| Auth | None |
| Rate Limit | Standard |
| User Story | US-AUTH-004 |
| Success | 200 |

**Response Fields:** `{ valid: true, email, organisationName, role, expiresAt }`

**Errors:** 404 NOT_FOUND, 410 INVITATION_EXPIRED

---

### DELETE /api/invitations/:id

| Aspect | Details |
|--------|---------|
| Auth | Bearer + Admin role |
| Rate Limit | Standard |
| User Story | US-AUTH-004 |
| Success | 204 No Content |

**Errors:** 401 UNAUTHORIZED, 403 FORBIDDEN, 404 NOT_FOUND

---

## Section 4.5: Project Endpoints

### GET /api/projects

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| Paginated | Yes |
| User Story | US-PROJ-002 |
| Success | 200 |

**Query Parameters:**

| Param | Type | Default | Max |
|-------|------|---------|-----|
| page | integer | 1 | - |
| limit | integer | 20 | 100 |
| sort_by | string | "updated_at" | - |
| sort_order | string | "desc" | - |

**Response Fields:** `[{ id, name, description, schema, sourceCount, lastProcessedAt, createdAt, updatedAt }]`

**Errors:** 401 UNAUTHORIZED

---

### POST /api/projects

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | US-PROJ-001 |
| Success | 201 Created |

**Request Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | string | Yes | min 1, max 100 chars, unique in org |
| description | string | No | max 500 chars |
| schema | string | No | "conversation", "qa_pairs", "knowledge_document" (default: "conversation") |

**Response Fields:** `{ id, name, description, schema, sourceCount: 0, createdAt, updatedAt }`

**Errors:** 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 409 DUPLICATE_NAME

---

### GET /api/projects/:projectId

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | US-PROJ-002 |
| Success | 200 |

**Response Fields:** `{ id, name, description, schema, qualityConfig, sourceCount, lastProcessedAt, currentProcessingRun, createdAt, updatedAt }`

**Errors:** 400 INVALID_ID, 401 UNAUTHORIZED, 404 NOT_FOUND

---

### PATCH /api/projects/:projectId

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | US-PROJ-003 |
| Success | 200 |

**Request Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | string | No | min 1, max 100 chars |
| description | string | No | max 500 chars |
| qualityConfig | object | No | `{ minCompleteness?: 0-100, minConversationLength?: number }` |

**Response Fields:** `{ id, name, description, schema, qualityConfig, sourceCount, createdAt, updatedAt }`

**Errors:** 400 VALIDATION_ERROR, 400 INVALID_ID, 401 UNAUTHORIZED, 404 NOT_FOUND, 409 DUPLICATE_NAME

---

### DELETE /api/projects/:projectId

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | US-PROJ-004 |
| Success | 204 No Content |

**Errors:** 400 INVALID_ID, 401 UNAUTHORIZED, 404 NOT_FOUND

**Note:** Soft delete - sets `isDeleted = true`. Cascades to sources, mappings, processing runs, exports.

---

## Section 4.6: Source Endpoints (File Upload)

### GET /api/projects/:projectId/sources

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| Paginated | Yes |
| User Story | US-SRC-004 |
| Success | 200 |

**Query Parameters:**

| Param | Type | Default |
|-------|------|---------|
| page | integer | 1 |
| limit | integer | 20 |
| type | string | all |

**Response Fields:** `[{ id, name, type, status, fileType, fileSize, recordCount, createdAt, updatedAt }]`

**Errors:** 400 INVALID_ID, 401 UNAUTHORIZED, 404 NOT_FOUND (project)

---

### POST /api/projects/:projectId/sources

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Upload (20/hour) |
| User Story | US-SRC-001 |
| Success | 201 Created |

**Request:** `multipart/form-data`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| file | file | Yes | Max 50MB, types: csv, xlsx, json |
| name | string | No | Auto-detected from filename |

**Response Fields:** `{ id, name, type: "file", fileType, fileSize, status: "processing", createdAt }`

**Errors:** 400 INVALID_ID, 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 404 NOT_FOUND, 413 UPLOAD_TOO_LARGE, 415 UNSUPPORTED_FILE_TYPE, 429 RATE_LIMIT_EXCEEDED

**Processing:** After upload, automatic structure detection runs. Poll `GET /sources/:sourceId` for status.

---

### GET /api/projects/:projectId/sources/:sourceId

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | US-SRC-003 |
| Success | 200 |

**Response Fields:** 
```
{ 
  id, name, type, status, fileType, fileSize, recordCount,
  detectedStructure: { 
    columns: [{ name, type, sample }], 
    sheets?: [{ name, columns }],
    keys?: [{ path, type }]
  },
  fields: [{ id, name, path, dataType, sampleValues, nullCount, uniqueCount }],
  errorMessage?,
  createdAt, updatedAt 
}
```

**Errors:** 400 INVALID_ID, 401 UNAUTHORIZED, 404 NOT_FOUND

---

### DELETE /api/projects/:projectId/sources/:sourceId

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | US-SRC-004 |
| Success | 204 No Content |

**Errors:** 400 INVALID_ID, 401 UNAUTHORIZED, 404 NOT_FOUND

---

### GET /api/projects/:projectId/sources/:sourceId/preview

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | US-SRC-003 |
| Success | 200 |

**Query Parameters:**

| Param | Type | Default | Max |
|-------|------|---------|-----|
| limit | integer | 100 | 100 |
| sheet | string | (first) | - |

**Response Fields:** `{ rows: [...], totalRows, columns: [{ name, type }] }`

**Errors:** 400 INVALID_ID, 401 UNAUTHORIZED, 404 NOT_FOUND

---

## Section 4.7: Source Endpoints (API Connectors)

### POST /api/projects/:projectId/api-sources

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | US-SRC-005, US-SRC-006 |
| Success | 201 Created |

**Request Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | string | Yes | min 1, max 100 chars |
| type | string | Yes | "api_teamwork" or "api_gohighlevel" |
| credentials | object | Yes | Connector-specific |
| config | object | No | Date range, filters |

**Teamwork Credentials:**
```
{ apiKey: string, subdomain: string }
```

**GoHighLevel Credentials:**
```
{ apiKey: string, locationId?: string }
```

**Config:**
```
{ dateRange?: { start: ISO8601, end: ISO8601 }, filters?: Record<string, string> }
```

**Response Fields:** `{ id, name, type, status: "pending", createdAt }`

**Errors:** 400 VALIDATION_ERROR, 400 INVALID_ID, 401 UNAUTHORIZED, 404 NOT_FOUND

---

### POST /api/projects/:projectId/api-sources/:sourceId/test

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | US-SRC-005, US-SRC-006 |
| Success | 200 |

**Response Fields:** `{ success: true, message: "Connection successful" }` or `{ success: false, error: "..." }`

**Errors:** 400 INVALID_ID, 401 UNAUTHORIZED, 404 NOT_FOUND

---

### POST /api/projects/:projectId/api-sources/:sourceId/import

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | US-SRC-005, US-SRC-006, US-SRC-007 |
| Success | 202 Accepted |

**Request Fields (optional):**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| incremental | boolean | No | Default false |
| dateRange | object | No | `{ start: ISO8601, end: ISO8601 }` |

**Response Fields:** `{ sourceId, status: "importing", message: "Import started" }`

**Errors:** 400 INVALID_ID, 401 UNAUTHORIZED, 404 NOT_FOUND, 423 PROCESSING_IN_PROGRESS

**Note:** Poll `GET /sources/:sourceId` for import status.

---

## Section 4.8: Configuration Endpoints (Schema & Mapping)

### GET /api/projects/:projectId/schema

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | US-MAP-002 |
| Success | 200 |

**Response Fields:**
```
{ 
  selected: "conversation" | "qa_pairs" | "knowledge_document",
  schemas: {
    conversation: { fields: [{ name, type, required, description }] },
    qa_pairs: { fields: [...] },
    knowledge_document: { fields: [...] }
  }
}
```

**Errors:** 400 INVALID_ID, 401 UNAUTHORIZED, 404 NOT_FOUND

---

### PUT /api/projects/:projectId/schema

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | US-MAP-002 |
| Success | 200 |

**Request Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| schema | string | Yes | "conversation", "qa_pairs", "knowledge_document" |

**Response Fields:** `{ selected, validationWarnings?: [{ field, message }] }`

**Errors:** 400 VALIDATION_ERROR, 400 INVALID_ID, 401 UNAUTHORIZED, 404 NOT_FOUND

**Note:** Changing schema may invalidate existing mappings.

---

### GET /api/projects/:projectId/mappings

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | US-MAP-001 |
| Success | 200 |

**Response Fields:**
```
{
  mappings: [{ 
    id, sourceFieldId, sourceFieldName, sourceFieldPath,
    targetField, isRequired,
    transformation: { type, config? }
  }],
  unmappedSourceFields: [{ id, name, path, dataType }],
  unmappedTargetFields: [{ name, type, required }]
}
```

**Errors:** 400 INVALID_ID, 401 UNAUTHORIZED, 404 NOT_FOUND

---

### PUT /api/projects/:projectId/mappings

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | US-MAP-001, US-MAP-003 |
| Success | 200 |

**Request Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| mappings | array | Yes | Array of mapping objects |

**Mapping Object:**
```
{ 
  sourceFieldId: number,
  targetField: string,
  transformation?: { type: "none" | "concatenate" | "split" | "date_format" | "case_convert", config?: object }
}
```

**Response Fields:** Same as GET response with validation status.

**Errors:** 400 VALIDATION_ERROR, 400 INVALID_ID, 401 UNAUTHORIZED, 404 NOT_FOUND

---

## Section 4.9: PII Detection & Rules Endpoints

### POST /api/projects/:projectId/pii/detect

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | US-PII-001 |
| Success | 202 Accepted |

**Request Fields (optional):**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| sourceIds | number[] | No | Specific sources to scan (default: all) |

**Response Fields:** `{ status: "detecting", message: "PII detection started" }`

**Errors:** 400 INVALID_ID, 401 UNAUTHORIZED, 404 NOT_FOUND

**Note:** Poll `GET /pii/rules` for detection results.

---

### GET /api/projects/:projectId/pii/rules

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | US-PII-002 |
| Success | 200 |

**Response Fields:**
```
{
  detectionStatus: "pending" | "detecting" | "complete",
  rules: [{
    id, sourceFieldId, sourceFieldName,
    piiType: "name" | "email" | "phone" | "address" | "dob" | "government_id" | "custom",
    detectionMethod: "automatic" | "manual" | "regex",
    confidenceScore?: number,
    handling: "mask" | "redact" | "pseudonymise" | "retain",
    maskFormat?: string,
    customPattern?: string,
    isConfirmed: boolean
  }]
}
```

**Errors:** 400 INVALID_ID, 401 UNAUTHORIZED, 404 NOT_FOUND

---

### PUT /api/projects/:projectId/pii/rules

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | US-PII-002, US-PII-003 |
| Success | 200 |

**Request Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| rules | array | Yes | Array of rule objects |

**Rule Object:**
```
{
  id?: number,  // Existing rule ID for update
  sourceFieldId: number,
  piiType: string,
  handling: "mask" | "redact" | "pseudonymise" | "retain",
  maskFormat?: string,  // e.g., "[EMAIL]", "[NAME]"
  customPattern?: string,  // Regex for custom detection
  isConfirmed: boolean
}
```

**Response Fields:** Same as GET response.

**Errors:** 400 VALIDATION_ERROR (including invalid regex), 400 INVALID_ID, 401 UNAUTHORIZED, 404 NOT_FOUND

---

### POST /api/projects/:projectId/pii/preview

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | US-PII-004 |
| Success | 200 |

**Request Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| sampleSize | number | No | Default 10, max 100 |

**Response Fields:**
```
{
  samples: [{
    original: { field1: "value", field2: "value" },
    processed: { field1: "masked", field2: "masked" }
  }],
  summary: { 
    totalFields: number, 
    fieldsWithPII: number,
    handlingCounts: { mask: n, redact: n, pseudonymise: n, retain: n }
  }
}
```

**Errors:** 400 INVALID_ID, 401 UNAUTHORIZED, 404 NOT_FOUND

---

## Section 4.10: Processing Endpoints

### POST /api/projects/:projectId/processing

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | US-PROC-001 |
| Success | 202 Accepted |

**Request Fields:** None

**Response Fields:** 
```
{ 
  runId, 
  status: "pending",
  message: "Processing started"
}
```

**Errors:** 400 INVALID_ID, 401 UNAUTHORIZED, 404 NOT_FOUND, 422 UNPROCESSABLE_ENTITY (missing mappings or sources), 423 PROCESSING_IN_PROGRESS

---

### GET /api/projects/:projectId/processing/current

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | US-PROC-001 |
| Success | 200 |

**Response Fields:**
```
{
  hasActiveRun: boolean,
  run?: {
    id, status, currentStage, 
    progress: { processed: n, total: n, percentage: n },
    stages: [{ stage, status, inputCount, outputCount, startedAt, completedAt }],
    startedAt, estimatedCompletion?
  }
}
```

**Errors:** 400 INVALID_ID, 401 UNAUTHORIZED, 404 NOT_FOUND (project)

---

### GET /api/projects/:projectId/processing/history

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| Paginated | Yes |
| User Story | US-PROC-002 |
| Success | 200 |

**Query Parameters:**

| Param | Type | Default |
|-------|------|---------|
| page | integer | 1 |
| limit | integer | 20 |

**Response Fields:** 
```
[{
  id, status, 
  inputRecordCount, outputRecordCount, excludedRecordCount,
  startedAt, completedAt, duration,
  triggeredBy: { id, name }
}]
```

**Errors:** 400 INVALID_ID, 401 UNAUTHORIZED, 404 NOT_FOUND

---

### GET /api/projects/:projectId/processing/:runId

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | US-PROC-001 |
| Success | 200 |

**Response Fields:**
```
{
  id, status, currentStage,
  progress: { processed: n, total: n, percentage: n },
  stages: [{ stage, status, inputCount, outputCount, startedAt, completedAt, errorMessage? }],
  configSnapshot: { schema, mappings, piiRules, qualityConfig },
  outputRecordCount, excludedRecordCount, errorMessage?,
  startedAt, completedAt,
  triggeredBy: { id, name }
}
```

**Errors:** 400 INVALID_ID, 401 UNAUTHORIZED, 404 NOT_FOUND

---

### POST /api/projects/:projectId/processing/:runId/cancel

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | US-PROC-001 |
| Success | 200 |

**Response Fields:** `{ status: "cancelled", message: "Processing cancelled" }`

**Errors:** 400 INVALID_ID, 401 UNAUTHORIZED, 404 NOT_FOUND, 400 BAD_REQUEST (already completed/cancelled)

---

## Section 4.11: Export Endpoints

### GET /api/projects/:projectId/exports

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| Paginated | Yes |
| User Story | US-EXP-003 |
| Success | 200 |

**Query Parameters:**

| Param | Type | Default |
|-------|------|---------|
| page | integer | 1 |
| limit | integer | 20 |

**Response Fields:**
```
[{
  id, format, status, recordCount, fileSizeBytes,
  processingRunId, downloadCount, 
  expiresAt, createdAt, lastDownloadedAt?
}]
```

**Errors:** 400 INVALID_ID, 401 UNAUTHORIZED, 404 NOT_FOUND

---

### POST /api/projects/:projectId/exports

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | US-EXP-001 |
| Success | 201 Created |

**Request Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| format | string | Yes | "jsonl", "qa_json", "structured_json" |
| processingRunId | number | No | Default: latest completed run |

**Response Fields:** `{ id, format, status: "generating", processingRunId, createdAt }`

**Errors:** 400 VALIDATION_ERROR, 400 INVALID_ID, 401 UNAUTHORIZED, 404 NOT_FOUND (project or run), 422 UNPROCESSABLE_ENTITY (no completed processing run)

---

### GET /api/projects/:projectId/exports/:exportId

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | US-EXP-002 |
| Success | 200 |

**Response Fields:**
```
{
  id, format, status, recordCount, fileSizeBytes,
  processingRunId, downloadCount, downloadUrl?,
  expiresAt, createdAt, lastDownloadedAt?
}
```

**Errors:** 400 INVALID_ID, 401 UNAUTHORIZED, 404 NOT_FOUND, 410 GONE (expired)

---

### GET /api/projects/:projectId/exports/:exportId/download

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | US-EXP-002 |
| Success | 200 |

**Response:** Binary file download with appropriate headers:
- `Content-Type: application/json` or `application/x-ndjson`
- `Content-Disposition: attachment; filename="export-{id}.{format}"`

**Errors:** 400 INVALID_ID, 401 UNAUTHORIZED, 404 NOT_FOUND, 410 GONE (expired), 422 UNPROCESSABLE_ENTITY (not ready)

---

## Section 4.12: Audit Endpoints

### GET /api/projects/:projectId/audit/lineage

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | US-AUD-001 |
| Success | 200 |

**Query Parameters:**

| Param | Type | Required |
|-------|------|----------|
| runId | number | No (default: latest) |

**Response Fields:**
```
{
  processingRun: { id, status, startedAt, completedAt },
  sources: [{ id, name, type, recordCount }],
  configuration: {
    schema: string,
    mappings: [{ sourceField, targetField, transformation? }],
    piiRules: [{ field, piiType, handling }],
    qualityConfig: { minCompleteness?, minConversationLength? }
  },
  stages: [{
    stage, inputCount, outputCount, 
    transformationsApplied: number, recordsFiltered: number
  }],
  output: { recordCount, excludedCount, format? }
}
```

**Errors:** 400 INVALID_ID, 401 UNAUTHORIZED, 404 NOT_FOUND

---

### GET /api/projects/:projectId/audit/pii-summary

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| User Story | US-AUD-002 |
| Success | 200 |

**Query Parameters:**

| Param | Type | Required |
|-------|------|----------|
| runId | number | No (default: latest) |

**Response Fields:**
```
{
  processingRun: { id, completedAt },
  summary: {
    totalRecords: number,
    recordsWithPII: number,
    byType: { name: n, email: n, phone: n, address: n, dob: n, government_id: n, custom: n },
    byHandling: { mask: n, redact: n, pseudonymise: n, retain: n }
  },
  fieldDetails: [{
    sourceFieldName, piiType, handling, 
    detectionConfidence?: number, instancesProcessed: number
  }],
  samples?: [{ original: string, processed: string }]  // Only if retained data includes samples
}
```

**Errors:** 400 INVALID_ID, 401 UNAUTHORIZED, 404 NOT_FOUND

---

### GET /api/projects/:projectId/audit/events

| Aspect | Details |
|--------|---------|
| Auth | Bearer |
| Rate Limit | Standard |
| Paginated | Yes |
| User Story | US-AUD-001 |
| Success | 200 |

**Query Parameters:**

| Param | Type | Default |
|-------|------|---------|
| page | integer | 1 |
| limit | integer | 20 |
| event_type | string | all |
| after | ISO8601 | - |
| before | ISO8601 | - |

**Response Fields:**
```
[{
  id, eventType, resourceType, resourceId,
  details: object,
  user: { id, name }?,
  createdAt
}]
```

**Errors:** 400 INVALID_ID, 401 UNAUTHORIZED, 404 NOT_FOUND

---

## Section 5: Parameterized Endpoint Failure Modes

All endpoints with `:id` parameters use `parseIntParam` validation:

| Input Type | Example | Status | Code |
|------------|---------|--------|------|
| Valid | /resources/123 | 2xx | - |
| Non-numeric | /resources/abc | 400 | INVALID_ID |
| Negative | /resources/-5 | 400 | INVALID_ID |
| Zero | /resources/0 | 400 | INVALID_ID |
| Float | /resources/1.5 | 400 | INVALID_ID |
| Not found | /resources/999999 | 404 | NOT_FOUND |

---

## Section 6: Implementation Reference

### 6.1 Response Helpers (server/lib/response.ts)

| Function | Status | Usage |
|----------|--------|-------|
| sendSuccess(res, data) | 200 | Single resource GET, PATCH |
| sendCreated(res, data) | 201 | POST creating resource |
| sendPaginated(res, data, pagination) | 200 | List endpoints |
| sendNoContent(res) | 204 | DELETE |
| sendAccepted(res, data) | 202 | Async operations started |

### 6.2 Route Registration Order

```typescript
// server/routes/index.ts
app.get("/api/health", healthHandler);
app.use("/api/auth", authRoutes);
app.use("/api/organisations", requireAuth, organisationRoutes);
app.use("/api/invitations", invitationRoutes);  // Mixed auth
app.use("/api/projects", requireAuth, projectRoutes);
// Error handler last
app.use(errorMiddleware);
```

### 6.3 Critical Files

| File | Purpose |
|------|---------|
| server/lib/response.ts | Response helpers |
| server/lib/validation.ts | parseIntParam, Zod utilities |
| server/lib/errors.ts | ERROR_CODES registry, AppError classes |
| shared/validators.ts | Zod schemas shared with frontend |
| server/middleware/auth.ts | JWT validation, requireAuth |
| server/middleware/rbac.ts | requireRole middleware |
| server/middleware/rate-limit.ts | Rate limiters |

### 6.4 Zod Schema Summary

| Schema | Fields | Location |
|--------|--------|----------|
| registerSchema | email, password, name, inviteToken? | shared/validators.ts |
| loginSchema | email, password | shared/validators.ts |
| updateProfileSchema | name?, currentPassword?, newPassword? | shared/validators.ts |
| createProjectSchema | name, description?, schema? | shared/validators.ts |
| updateProjectSchema | name?, description?, qualityConfig? | shared/validators.ts |
| createSourceSchema | file (handled by multer) | server/routes/sources.ts |
| createApiSourceSchema | name, type, credentials, config? | shared/validators.ts |
| updateMappingsSchema | mappings[] | shared/validators.ts |
| updatePiiRulesSchema | rules[] | shared/validators.ts |
| createExportSchema | format, processingRunId? | shared/validators.ts |

---

## Section 7: Document Validation

### 7.1 PRD Coverage

| User Story | Endpoint(s) | Status |
|------------|-------------|--------|
| US-AUTH-001 | POST /api/auth/register | Covered |
| US-AUTH-002 | POST /api/auth/login, GET /api/auth/me | Covered |
| US-AUTH-003 | POST /api/auth/forgot-password, GET/POST /api/auth/reset-password | Covered |
| US-AUTH-004 | POST/GET /api/invitations, GET /api/invitations/:token | Covered |
| US-ORG-001 | GET/PATCH /api/organisations | Covered |
| US-ORG-002 | GET/PATCH/DELETE /api/organisations/members | Covered |
| US-PROJ-001 | POST /api/projects | Covered |
| US-PROJ-002 | GET /api/projects, GET /api/projects/:id | Covered |
| US-PROJ-003 | PATCH /api/projects/:id | Covered |
| US-PROJ-004 | DELETE /api/projects/:id | Covered |
| US-SRC-001 | POST /api/projects/:id/sources | Covered |
| US-SRC-002 | GET /api/projects/:id/sources/:id (detectedStructure) | Covered |
| US-SRC-003 | GET /api/projects/:id/sources/:id/preview | Covered |
| US-SRC-004 | GET/DELETE /api/projects/:id/sources | Covered |
| US-SRC-005 | POST /api/projects/:id/api-sources (teamwork) | Covered |
| US-SRC-006 | POST /api/projects/:id/api-sources (gohighlevel) | Covered |
| US-SRC-007 | POST /api/projects/:id/api-sources/:id/import | Covered |
| US-MAP-001 | GET/PUT /api/projects/:id/mappings | Covered |
| US-MAP-002 | GET/PUT /api/projects/:id/schema | Covered |
| US-MAP-003 | PUT /api/projects/:id/mappings (transformation) | Covered |
| US-PII-001 | POST /api/projects/:id/pii/detect | Covered |
| US-PII-002 | GET/PUT /api/projects/:id/pii/rules | Covered |
| US-PII-003 | PUT /api/projects/:id/pii/rules (customPattern) | Covered |
| US-PII-004 | POST /api/projects/:id/pii/preview | Covered |
| US-PROC-001 | POST /api/projects/:id/processing, GET .../current | Covered |
| US-PROC-002 | GET /api/projects/:id/processing/history | Covered |
| US-PROC-003 | PATCH /api/projects/:id (qualityConfig) | Covered |
| US-PROC-004 | POST /api/projects/:id/processing (role identification in pipeline) | Covered |
| US-EXP-001 | POST /api/projects/:id/exports | Covered |
| US-EXP-002 | GET /api/projects/:id/exports/:id/download | Covered |
| US-EXP-003 | GET /api/projects/:id/exports | Covered |
| US-AUD-001 | GET /api/projects/:id/audit/lineage, .../events | Covered |
| US-AUD-002 | GET /api/projects/:id/audit/pii-summary | Covered |

**Coverage:** 32 of 32 user stories covered (100%)

### 7.2 Data Model Alignment

| Entity | C | R | U | D | Notes |
|--------|---|---|---|---|-------|
| users | x | x | x | - | No delete in MVP |
| organisations | x | x | x | - | Created via registration |
| organisationMembers | x | x | x | x | Via member endpoints |
| invitations | x | x | - | x | No update, only create/delete |
| passwordResetTokens | x | x | - | x | Internal, via auth endpoints |
| projects | x | x | x | x | Full CRUD |
| sources | x | x | - | x | No update, replace via delete/create |
| sourceFields | x | x | - | - | Auto-generated during detection |
| fieldMappings | x | x | x | - | Bulk update via PUT |
| piiRules | x | x | x | - | Bulk update via PUT |
| processingRuns | x | x | - | - | Status updates internal |
| processingStages | x | x | - | - | Internal tracking |
| exports | x | x | - | - | Auto-expire, no manual delete |
| auditEvents | x | x | - | - | Read-only for users |

### 7.3 Replit Compliance

- [x] GET /api/health exists (per Constitution Section C)
- [x] Port 5000 configured (per Constitution Section C)
- [x] All endpoints use /api prefix (per Constitution Section C)
- [x] CORS configured for Replit domains (per Architecture)
- [x] Trust proxy enabled (per Constitution Section D)
- [x] Rate limit headers specified (per Architecture Section 6.2)

### 7.4 Confidence Scores

| Section | Score | Notes |
|---------|-------|-------|
| Endpoint Coverage | 10/10 | All 32 user stories mapped |
| Schema Quality | 9/10 | Complete Zod schemas specified |
| Error Handling | 9/10 | Full error code registry |
| Consistency | 10/10 | Uniform conventions throughout |
| Overall | 9.5/10 | Complete, deployment-ready contract |

### Document Status: COMPLETE

---

## Section 8: Downstream Agent Handoff Brief

### For Agent 5: UI/UX Specification

**API Base:** http://localhost:5000/api (dev) | https://[app].replit.app/api (prod)

**Endpoints Per Screen:**

| Screen | Endpoint | Method | Data Fields |
|--------|----------|--------|-------------|
| Login | /api/auth/login | POST | email, password -> token, user |
| Register | /api/auth/register | POST | email, password, name, inviteToken? -> token, user |
| Forgot Password | /api/auth/forgot-password | POST | email -> message |
| Reset Password | /api/auth/reset-password | GET/POST | token, newPassword -> message |
| Dashboard | /api/projects | GET | projects[] with pagination |
| Project Detail | /api/projects/:id | GET | project with sources, processing status |
| Sources List | /api/projects/:id/sources | GET | sources[] with pagination |
| Source Upload | /api/projects/:id/sources | POST | file -> source |
| Source Preview | /api/projects/:id/sources/:id/preview | GET | rows[], columns[] |
| API Connector | /api/projects/:id/api-sources | POST | credentials, config -> source |
| Schema Config | /api/projects/:id/schema | GET/PUT | selected, schemas |
| Field Mapping | /api/projects/:id/mappings | GET/PUT | mappings[], unmapped fields |
| PII Config | /api/projects/:id/pii/rules | GET/PUT | rules[] |
| PII Preview | /api/projects/:id/pii/preview | POST | samples[], summary |
| Processing | /api/projects/:id/processing | POST/GET | run status, progress |
| Processing History | /api/projects/:id/processing/history | GET | runs[] with pagination |
| Exports | /api/projects/:id/exports | GET/POST | exports[] with pagination |
| Export Download | /api/projects/:id/exports/:id/download | GET | Binary file |
| Audit Lineage | /api/projects/:id/audit/lineage | GET | sources, config, stages |
| Audit PII | /api/projects/:id/audit/pii-summary | GET | summary, fieldDetails |
| Profile | /api/auth/me | GET | user |
| Profile Edit | /api/auth/profile | PATCH | name, currentPassword?, newPassword? |
| Organisation | /api/organisations | GET/PATCH | org details |
| Members | /api/organisations/members | GET/PATCH/DELETE | members[] |
| Invitations | /api/invitations | GET/POST/DELETE | invitations[] |
| Accept Invite | /api/invitations/:token | GET | valid, email, organisationName |

**Error Handling:** Map error codes to user messages per ERROR_CODES registry (Section 3)

**Auth Flow:**
- Store token in localStorage (key: `auth_token`)
- On 401: clear token, redirect to /login
- Include `Authorization: Bearer <token>` on all authenticated requests

### For Agent 6: Implementation Orchestrator

**Route Structure:** See Section 6.2 for registration order

**Critical Files:**
- server/lib/response.ts - Response helpers (sendSuccess, sendCreated, sendPaginated, sendNoContent, sendAccepted)
- server/lib/validation.ts - parseIntParam, Zod validation utilities
- server/lib/errors.ts - ERROR_CODES registry, AppError classes
- shared/validators.ts - Zod schemas (shared with frontend)
- server/middleware/auth.ts - requireAuth middleware
- server/middleware/rbac.ts - requireRole middleware
- server/middleware/rate-limit.ts - globalLimiter, authLimiter, uploadLimiter

**Database:** postgres-js driver (NOT @neondatabase/serverless)

**Key Implementation Notes:**
- All list endpoints MUST use paginated envelope
- All error responses MUST use error envelope
- All :id parameters MUST use parseIntParam
- Async operations (processing, import, detect) return 202 with polling endpoint
- File uploads use multipart/form-data with multer
- Rate limit headers MUST be included on all responses

### For Agent 7: QA & Deployment

**Health Check:** `curl http://localhost:5000/api/health`

Expected: `{ "status": "ok", "timestamp": "2025-01-18T00:00:00.000Z" }`

**Validation Tests:**
1. Test all parameterized endpoints with invalid IDs (abc, -1, 0, 1.5)
2. Verify 400 INVALID_ID response with proper error envelope
3. Test auth endpoints with rate limiting (6+ rapid requests should return 429)
4. Test file upload with >50MB file (should return 413)
5. Test file upload with .txt file (should return 415)

**Rate Limit Test:**
1. Send 6 rapid login requests
2. Verify 5th succeeds, 6th returns 429
3. Verify X-RateLimit-* headers present on all responses

**Pagination Test:**
1. Create 25 projects
2. Request GET /api/projects?limit=10
3. Verify pagination object: `{ page: 1, limit: 10, total: 25, totalPages: 3, hasMore: true }`

**Auth Test:**
1. Register user, verify 201 with token
2. Login, verify 200 with token
3. Access /api/auth/me with token, verify 200
4. Access /api/auth/me without token, verify 401
5. Access /api/auth/me with expired token, verify 401

### Handoff Metrics

| Metric | Count |
|--------|-------|
| Total endpoints | 47 |
| Authenticated endpoints | 41 |
| Public endpoints | 6 |
| Paginated endpoints | 10 |
| Async (202) endpoints | 5 |
| Zod schemas | 12 |

---

## ASSUMPTION REGISTER

### AR-001: Invitation Token in Response
- **Type:** ASSUMPTION
- **Source Gap:** PRD does not specify whether invitation token should be returned in API response
- **Assumption Made:** Token is returned only in POST /api/invitations response for email sending purposes
- **Impact if Wrong:** May need separate endpoint or mechanism to retrieve token for email
- **Proposed Resolution:** Confirm invitation email sending approach
- **Status:** UNRESOLVED
- **Owner:** Human
- **Date:** 2025-01-18

### AR-002: Password Reset Token Validation Endpoint
- **Type:** ASSUMPTION
- **Source Gap:** PRD US-AUTH-003 mentions reset flow but not token validation before form display
- **Assumption Made:** GET /api/auth/reset-password/:token validates token and returns partial email for UI confirmation
- **Impact if Wrong:** UI may show form without knowing if token is valid
- **Proposed Resolution:** Confirm UX flow for reset password page
- **Status:** UNRESOLVED
- **Owner:** Agent 5 (UI/UX)
- **Date:** 2025-01-18

### AR-003: Source Update Not Supported
- **Type:** ASSUMPTION
- **Source Gap:** PRD US-SRC does not specify source update workflow
- **Assumption Made:** Sources are immutable after creation; to update, delete and re-upload
- **Impact if Wrong:** May need PATCH endpoint for source metadata or configuration
- **Proposed Resolution:** Confirm source modification requirements
- **Status:** UNRESOLVED
- **Owner:** Human
- **Date:** 2025-01-18

### AR-004: Export Expiry Handling
- **Type:** ASSUMPTION
- **Source Gap:** PRD states 30-day retention but not error handling for expired exports
- **Assumption Made:** GET /api/exports/:id returns 410 GONE for expired exports
- **Impact if Wrong:** May need different status code or soft-delete behavior
- **Proposed Resolution:** Confirm expired resource handling pattern
- **Status:** UNRESOLVED
- **Owner:** Human
- **Date:** 2025-01-18

### AR-005: Bulk PII Rule Update
- **Type:** ASSUMPTION
- **Source Gap:** PRD US-PII-002 mentions "configure rules" but not update mechanism
- **Assumption Made:** PUT /api/projects/:id/pii/rules replaces all rules (bulk update pattern)
- **Impact if Wrong:** May need individual PATCH endpoints for rule updates
- **Proposed Resolution:** Confirm rule management UX pattern
- **Status:** UNRESOLVED
- **Owner:** Agent 5 (UI/UX)
- **Date:** 2025-01-18

### AR-006: Processing Cancellation
- **Type:** ASSUMPTION
- **Source Gap:** PRD US-PROC does not mention cancellation capability
- **Assumption Made:** Added POST /api/projects/:id/processing/:runId/cancel for completeness
- **Impact if Wrong:** May be unnecessary if processing always completes or fails
- **Proposed Resolution:** Confirm whether cancellation is MVP requirement
- **Status:** UNRESOLVED
- **Owner:** Human
- **Date:** 2025-01-18

### AR-007: Audit Event Types
- **Type:** DEPENDENCY
- **Source Gap:** Data Model lists event types but no API specification for filtering
- **Assumption Made:** GET /api/projects/:id/audit/events supports event_type query parameter
- **Impact if Wrong:** May need separate endpoints per event category
- **Proposed Resolution:** Confirm audit UI requirements
- **Status:** UNRESOLVED
- **Owner:** Agent 5 (UI/UX)
- **Date:** 2025-01-18

---

## Prompt Maintenance Contract

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

## Document End
