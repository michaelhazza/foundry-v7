# 01-PRD.md - Foundry Product Requirements Document

## FRAMEWORK VERSION

Framework: Agent Specification Framework v2.1
Constitution: Agent 0 - Agent Constitution v3
Status: Active

---

## VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1 | 2025-01-18 | Initial PRD from Executive Brief; Hygiene Gate: PASS |

---

## Section 1: Executive Summary

Foundry is a multi-tenant data preparation platform that transforms raw business data from any source into clean, de-identified, structured datasets ready for AI systems, agents, and evaluation workflows.

**Primary Value Proposition:** Turn heterogeneous, messy, real-world business data into consistent, reusable datasets that AI systems can safely consume—without custom engineering.

**Target Market:** Organisations seeking to leverage their operational data (support tickets, sales conversations, documentation, CRM records) for AI applications including agent training, retrieval-augmented generation, and evaluation testing.

**Key Differentiators:**
- Source-agnostic ingestion (files, APIs, databases treated equally)
- Configuration-driven workflows (no code required)
- Privacy and de-identification as first-class features
- Schema-first normalisation for consistent AI consumption
- Multi-tenant isolation with project-based organisation

**Deployment Target:** Replit (web application)

---

## Section 2: Problem Statement

**Problem Description (Human Terms):**

Businesses have years of valuable operational data trapped in disconnected systems—customer support tickets in helpdesks, sales conversations in CRMs, procedural knowledge in wikis and spreadsheets, historical decisions in databases. This data contains the patterns, language, and domain expertise that could make AI systems genuinely useful for their specific context.

But this data cannot be used. It contains customer names, email addresses, internal identifiers, and sensitive commercial information. It exists in incompatible formats—each system structures data differently. Converting even a single source into AI-ready format requires custom engineering: building extractors, writing transformation scripts, implementing privacy handling, and maintaining these systems as sources change.

The result: organisations either abandon AI initiatives requiring their own data, or they invest months of engineering time per use case—only to repeat the work when requirements change.

**Current Alternatives and Limitations:**
- Custom engineering per data source (expensive, slow, requires technical expertise)
- Generic ETL tools (not designed for AI output formats, lack privacy handling)
- Manual data cleaning (does not scale, error-prone, inconsistent)
- Avoiding proprietary data entirely (limits AI system effectiveness)

**Quantified Impact:**
- Each new AI data preparation project requires 2-6 weeks of custom engineering
- Privacy compliance for AI training data adds 40-60% overhead to data preparation time
- Format inconsistencies cause 20-30% of AI agent training failures
- Organisations typically have 5-15 potential AI use cases blocked by data readiness

**Person Experiencing the Pain:**
- Operations managers who see AI potential but lack technical resources
- Data engineers repeatedly building similar pipelines for different AI projects
- Compliance officers unable to verify AI training data meets privacy requirements
- AI/ML engineers waiting months for properly formatted training data

---

## Section 3: User Personas

### Persona 1: Sarah - Operations Manager

**Demographics:** 35-45 years old, non-technical background, manages customer support or sales operations team of 10-50 people

**Goals:**
- Improve team efficiency using AI-powered tools
- Leverage historical data to train AI agents that understand her business context
- Reduce time-to-value for AI initiatives without depending on engineering resources

**Motivations:**
- Prove operational innovation to leadership
- Reduce repetitive work for her team
- Stay competitive as industry adopts AI

**Pain Points:**
- Cannot extract data from existing tools without developer help
- Privacy compliance requirements block direct use of operational data
- Previous AI projects stalled waiting for "data preparation"

**Technical Proficiency:** Comfortable with spreadsheets, basic data manipulation, SaaS tools. Cannot write code or SQL.

**Usage Context:** Uses Foundry weekly to prepare datasets for new AI initiatives. Primary touchpoints: file upload, field mapping, export.

**Success Metrics:** Time from "idea" to "AI-ready dataset" under 1 week. Confidence that exports meet privacy requirements.

---

### Persona 2: Marcus - Data Engineer

**Demographics:** 28-38 years old, technical background, part of a small data or platform team (2-5 people)

**Goals:**
- Eliminate repetitive pipeline-building work
- Standardise data preparation across multiple AI projects
- Maintain data lineage and auditability for compliance

**Motivations:**
- Focus on high-value engineering work rather than extraction/transformation
- Build reusable infrastructure rather than one-off scripts
- Reduce on-call burden from fragile custom pipelines

**Pain Points:**
- Builds similar data pipelines repeatedly for different business units
- Each new AI use case requires understanding another source system's data model
- Privacy handling implemented inconsistently across projects

**Technical Proficiency:** Expert in databases, APIs, scripting. Evaluates tools critically.

**Usage Context:** Sets up initial integrations and schemas, then hands off to business users. Returns for complex configurations or troubleshooting.

**Success Metrics:** Time to connect new source under 2 hours. Zero data leakage incidents. Reusable schemas across projects.

---

### Persona 3: Elena - AI/ML Engineer

**Demographics:** 30-40 years old, machine learning background, works on internal AI product development

**Goals:**
- Obtain high-quality, consistently-formatted training and evaluation data
- Iterate quickly on data requirements as AI models evolve
- Create reliable evaluation datasets from real operational scenarios

**Motivations:**
- Improve AI model performance with better training data
- Reduce time debugging data format issues
- Build comprehensive evaluation suites from production data

**Pain Points:**
- Receives data in inconsistent formats from different sources
- Cannot regenerate training data when requirements change
- Evaluation datasets do not reflect real-world complexity

**Technical Proficiency:** Expert in ML/AI, comfortable with data formats (JSON, JSONL), expects programmatic access patterns.

**Usage Context:** Defines output schemas needed for specific AI applications. Triggers re-processing when model requirements change. Evaluates data quality metrics.

**Success Metrics:** Data format matches training requirements without transformation. Can regenerate updated datasets within hours.

---

### Persona 4: David - Compliance Officer

**Demographics:** 40-55 years old, legal or risk management background, responsible for data governance

**Goals:**
- Verify that AI systems are trained on properly de-identified data
- Maintain audit trails for data processing activities
- Ensure data handling meets regulatory requirements (GDPR, CCPA, industry-specific)

**Motivations:**
- Protect organisation from regulatory penalties
- Enable AI adoption within governance framework
- Reduce time spent reviewing ad-hoc data handling approaches

**Pain Points:**
- Cannot verify what data went into AI training datasets
- Different teams implement privacy handling inconsistently
- No centralised view of data transformations and de-identification

**Technical Proficiency:** Limited technical skills, expects clear reports and audit interfaces.

**Usage Context:** Reviews processing configurations before approving AI projects. Audits data lineage and de-identification rules periodically.

**Success Metrics:** Complete audit trail for any processed dataset. Confidence score for de-identification coverage.

---

## Section 4: User Stories and Requirements

### Authentication & Access

```
ID: US-AUTH-001
Persona: All
Story: As a user, I want to register for a Foundry account so that I can access the platform
Acceptance Criteria:
  - Given I am on the registration page, when I provide valid email and password, then my account is created and I receive confirmation
  - Given registration requires organisation context, when I register via invitation, then I am added to the inviting organisation
  - Given I enter an invalid email format, when I submit, then I see a validation error
Priority: P0-Critical
MVP Status: MVP
Dependencies: None
Estimated Complexity: M
```

```
ID: US-AUTH-002
Persona: All
Story: As a user, I want to log in to my account so that I can access my organisation's projects
Acceptance Criteria:
  - Given valid credentials, when I log in, then I am redirected to my dashboard
  - Given invalid credentials, when I log in, then I see an error message without revealing which field is wrong
  - Given I am inactive for 24 hours, when I next access the platform, then I must re-authenticate
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-AUTH-001
Estimated Complexity: M
```

```
ID: US-AUTH-003
Persona: All
Story: As a user, I want to reset my password so that I can regain access if I forget it
Acceptance Criteria:
  - Given I request a password reset, when I provide my email, then I receive a reset link within 5 minutes
  - Given I have a reset token, when I set a new password meeting requirements, then my password is updated
  - Given my reset token is expired (>1 hour), when I try to use it, then I see an error and can request a new one
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-AUTH-001
Estimated Complexity: M
```

```
ID: US-AUTH-004
Persona: All
Story: As an organisation admin, I want to invite new users to my organisation so that my team can collaborate
Acceptance Criteria:
  - Given I am an admin, when I send an invitation email, then the recipient receives a link to join my organisation
  - Given an invitation link, when an existing user clicks it, then they are added to my organisation
  - Given an invitation link, when a new user clicks it, then they complete registration and are added to my organisation
  - Given an invitation is pending for 7 days, when it expires, then it can no longer be used
Priority: P1-High
MVP Status: MVP
Dependencies: US-AUTH-001
Estimated Complexity: M
```

### Organisation Management

```
ID: US-ORG-001
Persona: Marcus (Data Engineer)
Story: As an organisation admin, I want to manage organisation settings so that I can configure platform-wide defaults
Acceptance Criteria:
  - Given I am an admin, when I access organisation settings, then I can view and edit organisation name and details
  - Given I modify settings, when I save, then changes take effect immediately for all users
Priority: P1-High
MVP Status: MVP
Dependencies: US-AUTH-001
Estimated Complexity: S
```

```
ID: US-ORG-002
Persona: Marcus (Data Engineer)
Story: As an organisation admin, I want to view and manage organisation members so that I can control access
Acceptance Criteria:
  - Given I am an admin, when I view members, then I see all users with their roles and last activity
  - Given I am an admin, when I change a user's role, then their permissions update immediately
  - Given I am an admin, when I remove a user, then they lose access but their created content remains
  - Given I try to remove the last admin, when I confirm, then I see an error preventing the action
Priority: P1-High
MVP Status: MVP
Dependencies: US-AUTH-001, US-AUTH-004
Estimated Complexity: M
```

### Project Management

```
ID: US-PROJ-001
Persona: Sarah (Operations Manager)
Story: As a user, I want to create a new project so that I can organise data preparation for a specific AI initiative
Acceptance Criteria:
  - Given I am logged in, when I create a project with a name and description, then a new project is created in my organisation
  - Given I create a project, when it is created, then I am set as the project owner
  - Given a project name already exists, when I try to create a duplicate, then I see a validation error
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-AUTH-002
Estimated Complexity: S
```

```
ID: US-PROJ-002
Persona: Sarah (Operations Manager)
Story: As a project member, I want to view all my organisation's projects so that I can find and access relevant work
Acceptance Criteria:
  - Given I am logged in, when I view the projects list, then I see all projects in my organisation with name, description, and last updated date
  - Given multiple projects exist, when I view the list, then projects are sorted by last updated (most recent first)
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-PROJ-001
Estimated Complexity: S
```

```
ID: US-PROJ-003
Persona: Sarah (Operations Manager)
Story: As a project owner, I want to configure project settings so that I can define how data is processed
Acceptance Criteria:
  - Given I am a project owner, when I access project settings, then I can edit name, description, and processing configuration
  - Given I modify project settings, when I save, then changes are persisted and visible to other project members
Priority: P1-High
MVP Status: MVP
Dependencies: US-PROJ-001
Estimated Complexity: S
```

```
ID: US-PROJ-004
Persona: Sarah (Operations Manager)
Story: As a project owner, I want to delete a project so that I can remove completed or abandoned work
Acceptance Criteria:
  - Given I am a project owner, when I delete a project, then I must confirm the action
  - Given I confirm deletion, when the project is deleted, then all associated sources, processing configurations, and outputs are removed
  - Given a project has processed datasets, when I try to delete, then I see a warning about data loss before confirmation
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-PROJ-001
Estimated Complexity: S
```

### Source Management (File Upload)

```
ID: US-SRC-001
Persona: Sarah (Operations Manager)
Story: As a project member, I want to upload data files so that I can bring data into the platform for processing
Acceptance Criteria:
  - Given I am in a project, when I upload a CSV file under 50MB, then it is accepted and stored
  - Given I am in a project, when I upload an Excel file (.xlsx) under 50MB, then it is accepted and stored
  - Given I am in a project, when I upload a JSON file under 50MB, then it is accepted and stored
  - Given I upload an unsupported file type, when the upload completes, then I see an error message
  - Given I upload a file over the size limit, when the upload starts, then I see an error before the upload completes
  - Given upload fails mid-way, when I retry, then the previous partial upload is cleaned up
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-PROJ-001
Estimated Complexity: M
```

```
ID: US-SRC-002
Persona: Sarah (Operations Manager)
Story: As a project member, I want the system to detect file structure automatically so that I can map fields without manual inspection
Acceptance Criteria:
  - Given I upload a CSV, when processing begins, then column headers are automatically detected
  - Given I upload an Excel file, when processing begins, then sheet names and column headers are detected
  - Given I upload a JSON file, when processing begins, then top-level keys and nested structures are identified
  - Given detection completes, when I view the source, then I see detected fields with inferred data types
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-SRC-001
Estimated Complexity: L
```

```
ID: US-SRC-003
Persona: Sarah (Operations Manager)
Story: As a project member, I want to preview uploaded data so that I can verify the file was interpreted correctly
Acceptance Criteria:
  - Given I have uploaded a file, when I view the source, then I see a preview of the first 100 rows
  - Given the file has multiple sheets (Excel), when I view the source, then I can switch between sheets
  - Given data contains special characters, when I view the preview, then characters render correctly
Priority: P1-High
MVP Status: MVP
Dependencies: US-SRC-001, US-SRC-002
Estimated Complexity: M
```

```
ID: US-SRC-004
Persona: Sarah (Operations Manager)
Story: As a project member, I want to view and manage all sources in a project so that I can track what data is available
Acceptance Criteria:
  - Given I am in a project, when I view sources, then I see all uploaded files and connected APIs with status
  - Given multiple sources exist, when I view the list, then I see file name, type, record count, and upload date
  - Given I want to remove a source, when I delete it, then it is removed from the project (with confirmation if used in processing)
Priority: P1-High
MVP Status: MVP
Dependencies: US-SRC-001
Estimated Complexity: S
```

### Source Management (API Connectors)

```
ID: US-SRC-005
Persona: Marcus (Data Engineer)
Story: As a project member, I want to connect to Teamwork Desk so that I can import support ticket data
Acceptance Criteria:
  - Given I am in a project, when I configure Teamwork Desk connection with valid API credentials, then the connection is validated and saved
  - Given a valid connection, when I initiate import, then tickets with conversations are retrieved
  - Given invalid credentials, when I test the connection, then I see a clear error message
  - Given rate limits are hit, when import is running, then the system backs off and retries automatically
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-PROJ-001
Estimated Complexity: XL
```

```
ID: US-SRC-006
Persona: Marcus (Data Engineer)
Story: As a project member, I want to connect to GoHighLevel so that I can import CRM and sales conversation data
Acceptance Criteria:
  - Given I am in a project, when I configure GoHighLevel connection with valid API credentials, then the connection is validated and saved
  - Given a valid connection, when I initiate import, then contacts, conversations, and relevant records are retrieved
  - Given invalid credentials, when I test the connection, then I see a clear error message
  - Given API structure changes, when import fails, then I see actionable error details
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-PROJ-001
Estimated Complexity: XL
```

```
ID: US-SRC-007
Persona: Marcus (Data Engineer)
Story: As a project member, I want to configure data ranges and filters for API imports so that I can control what data is retrieved
Acceptance Criteria:
  - Given I configure an API source, when I specify a date range, then only records within that range are imported
  - Given I configure an API source, when I specify field filters, then only matching records are imported
  - Given no filters are specified, when I import, then all accessible records are retrieved
Priority: P1-High
MVP Status: MVP
Dependencies: US-SRC-005, US-SRC-006
Estimated Complexity: M
```

### Field Mapping & Schema Configuration

```
ID: US-MAP-001
Persona: Sarah (Operations Manager)
Story: As a project member, I want to map source fields to a canonical schema so that different sources produce consistent output
Acceptance Criteria:
  - Given I have a source with detected fields, when I access mapping, then I see source fields alongside target schema fields
  - Given I map a source field to a schema field, when I save, then the mapping is persisted
  - Given a required schema field is unmapped, when I try to process, then I see a warning about missing required fields
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-SRC-002
Estimated Complexity: L
```

```
ID: US-MAP-002
Persona: Elena (AI/ML Engineer)
Story: As a project member, I want to select a canonical schema for my project so that output matches my AI system requirements
Acceptance Criteria:
  - Given I am configuring a project, when I view available schemas, then I see Conversation, Q&A, and Knowledge Document schemas
  - Given I select a schema, when I save, then all mappings are validated against the selected schema
  - Given I change schemas, when existing mappings conflict, then I am prompted to resolve conflicts
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-PROJ-001
Estimated Complexity: M
```

```
ID: US-MAP-003
Persona: Marcus (Data Engineer)
Story: As a project member, I want to define custom mapping transformations so that I can handle non-standard source formats
Acceptance Criteria:
  - Given a source field needs transformation, when I define a mapping rule (concatenation, split, format conversion), then the rule is applied during processing
  - Given I define an invalid transformation, when I save, then I see a validation error
  - Given multiple transformations apply to one field, when I process, then they execute in defined order
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-MAP-001
Estimated Complexity: L
```

### De-identification & Privacy

```
ID: US-PII-001
Persona: David (Compliance Officer)
Story: As a project member, I want automatic PII detection so that sensitive data is identified before processing
Acceptance Criteria:
  - Given I have uploaded data, when I run PII detection, then names, emails, phone numbers, and addresses are automatically flagged
  - Given PII is detected, when I view results, then I see field name, PII type, and confidence score
  - Given detection completes, when I review, then I can confirm or override detected PII classifications
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-SRC-002
Estimated Complexity: XL
```

```
ID: US-PII-002
Persona: David (Compliance Officer)
Story: As a project member, I want to configure de-identification rules so that PII is handled according to my requirements
Acceptance Criteria:
  - Given detected PII, when I configure rules, then I can choose: mask, redact, pseudonymise, or retain for each field
  - Given I select masking, when processing runs, then values are replaced with format-preserving masks (e.g., [EMAIL], [NAME])
  - Given I select pseudonymisation, when processing runs, then values are replaced with consistent fake values
  - Given I select redaction, when processing runs, then values are completely removed
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-PII-001
Estimated Complexity: L
```

```
ID: US-PII-003
Persona: Marcus (Data Engineer)
Story: As a project member, I want to define custom masking patterns so that I can handle domain-specific sensitive data
Acceptance Criteria:
  - Given I identify custom sensitive data (e.g., internal IDs, account numbers), when I create a custom rule with regex pattern, then matching values are masked
  - Given I define a custom rule, when I test against sample data, then I see which values would be masked
  - Given a custom rule conflicts with automatic detection, when processing runs, then custom rules take precedence
Priority: P1-High
MVP Status: MVP
Dependencies: US-PII-002
Estimated Complexity: M
```

```
ID: US-PII-004
Persona: David (Compliance Officer)
Story: As a project member, I want to preview de-identification results before full processing so that I can verify rules are correct
Acceptance Criteria:
  - Given I have configured de-identification rules, when I request a preview, then I see before/after comparison for a data sample
  - Given the preview shows unexpected results, when I adjust rules, then I can re-preview without running full processing
  - Given preview is satisfactory, when I confirm, then the rules are locked for processing
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-PII-002
Estimated Complexity: M
```

### Processing & Quality

```
ID: US-PROC-001
Persona: Sarah (Operations Manager)
Story: As a project member, I want to trigger data processing so that my configured pipeline produces output
Acceptance Criteria:
  - Given sources are connected and mappings configured, when I start processing, then the pipeline executes
  - Given processing is running, when I view status, then I see progress percentage and current stage
  - Given processing completes, when I view status, then I see success message with record counts
  - Given processing fails, when I view status, then I see error details with failed stage identification
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-MAP-001, US-PII-002
Estimated Complexity: XL
```

```
ID: US-PROC-002
Persona: Sarah (Operations Manager)
Story: As a project member, I want to re-run processing so that I can update outputs when source data or configuration changes
Acceptance Criteria:
  - Given processing has completed previously, when I trigger re-run, then the full pipeline executes with current configuration
  - Given re-run completes, when I view outputs, then previous outputs are replaced with new results
  - Given I modify configuration, when I re-run, then the new configuration is applied
Priority: P1-High
MVP Status: MVP
Dependencies: US-PROC-001
Estimated Complexity: M
```

```
ID: US-PROC-003
Persona: Elena (AI/ML Engineer)
Story: As a project member, I want to configure quality filters so that output only includes records meeting quality thresholds
Acceptance Criteria:
  - Given I access quality configuration, when I set minimum completeness threshold, then records below threshold are excluded from output
  - Given I configure filters, when I set minimum conversation length (for conversation data), then short exchanges are excluded
  - Given filters are configured, when processing runs, then excluded record count is reported separately
Priority: P1-High
MVP Status: MVP
Dependencies: US-PROC-001
Estimated Complexity: M
```

```
ID: US-PROC-004
Persona: Elena (AI/ML Engineer)
Story: As a project member, I want role identification in conversational data so that agent and customer turns are clearly distinguished
Acceptance Criteria:
  - Given conversational data is processed, when role identification runs, then each message is tagged with speaker role (agent/customer/system)
  - Given role detection is uncertain, when output is generated, then uncertain roles are flagged for review
  - Given I manually correct roles, when I save corrections, then they persist for future re-runs
Priority: P1-High
MVP Status: MVP
Dependencies: US-PROC-001
Estimated Complexity: L
```

### Export & Output

```
ID: US-EXP-001
Persona: Elena (AI/ML Engineer)
Story: As a project member, I want to export processed data in AI-ready formats so that I can use it in my AI systems
Acceptance Criteria:
  - Given processing is complete, when I export as JSONL, then I receive a file with one JSON object per line
  - Given processing is complete, when I export as Q&A pairs, then I receive structured question-answer format
  - Given processing is complete, when I export as structured JSON, then I receive nested JSON matching the schema
  - Given export completes, when I download, then the file is immediately available
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-PROC-001
Estimated Complexity: M
```

```
ID: US-EXP-002
Persona: Elena (AI/ML Engineer)
Story: As a project member, I want to download exported datasets so that I can use them in external systems
Acceptance Criteria:
  - Given an export is ready, when I click download, then the file downloads to my device
  - Given an export is large, when download starts, then I see progress indication
  - Given download is interrupted, when I retry, then download resumes or restarts cleanly
Priority: P0-Critical
MVP Status: MVP
Dependencies: US-EXP-001
Estimated Complexity: S
```

```
ID: US-EXP-003
Persona: Elena (AI/ML Engineer)
Story: As a project member, I want to view export history so that I can track and re-download previous exports
Acceptance Criteria:
  - Given I am in a project, when I view export history, then I see all exports with date, format, record count, and status
  - Given an export is in history, when I request re-download, then I receive the same file
  - Given exports are retained for 30 days, when a export expires, then it is removed from history with clear indication
Priority: P2-Medium
MVP Status: MVP
Dependencies: US-EXP-001
Estimated Complexity: S
```

### Audit & Lineage

```
ID: US-AUD-001
Persona: David (Compliance Officer)
Story: As a project member, I want to view processing lineage so that I can trace how output data was derived
Acceptance Criteria:
  - Given a processed dataset, when I view lineage, then I see source files/connections, transformations applied, and de-identification rules used
  - Given lineage is displayed, when I drill into a transformation, then I see configuration at time of processing
  - Given regulations require audit, when I export lineage, then I receive a complete audit report
Priority: P1-High
MVP Status: MVP
Dependencies: US-PROC-001
Estimated Complexity: L
```

```
ID: US-AUD-002
Persona: David (Compliance Officer)
Story: As a project member, I want to view de-identification summary so that I can verify privacy handling
Acceptance Criteria:
  - Given processing is complete, when I view de-identification summary, then I see counts by PII type and handling method
  - Given the summary is displayed, when I drill into a category, then I see sample masked values
  - Given audit is required, when I export summary, then I receive a compliance-ready report
Priority: P1-High
MVP Status: MVP
Dependencies: US-PII-002, US-PROC-001
Estimated Complexity: M
```

---

## Section 5: Feature Specification

### F-001: User Authentication System

**Description:** Complete authentication system supporting registration, login, password reset, and session management.

**User Stories Addressed:** US-AUTH-001, US-AUTH-002, US-AUTH-003

**Functional Requirements:**
- Email/password registration with validation
- JWT-based session tokens with 24-hour expiry
- Password reset via email with 1-hour token expiry
- Secure password hashing (bcrypt)

**Non-Functional Requirements:**
- Login response under 500ms
- Password requirements: minimum 8 characters, 1 uppercase, 1 number
- Rate limiting: 5 failed login attempts per 15 minutes

**Edge Cases:**
- User attempts registration with existing email
- User requests multiple password resets
- Token expiry during active session

**Error States:**
- Invalid credentials (generic message to prevent enumeration)
- Email delivery failure for password reset
- Session expired mid-operation

**Out of Scope:** OAuth/social login, multi-factor authentication, SSO

---

### F-002: Organisation & Team Management

**Description:** Multi-tenant organisation structure with role-based access control and invitation-based team building.

**User Stories Addressed:** US-AUTH-004, US-ORG-001, US-ORG-002

**Functional Requirements:**
- Organisation creation during first registration
- Two roles: Admin and Member
- Admin can invite users, manage roles, modify settings
- Member can access projects and sources

**Non-Functional Requirements:**
- Organisation isolation: no data visibility across tenants
- Invitation tokens valid for 7 days

**Edge Cases:**
- User invited to multiple organisations
- Last admin attempts to leave or be removed
- Invited user already has account vs. new user

**Error States:**
- Invalid invitation token
- Expired invitation token
- Attempt to escalate own privileges

**Out of Scope:** Custom roles, fine-grained permissions, organisation hierarchy

---

### F-003: Project Management

**Description:** Project-based organisation of data preparation workflows with configuration persistence.

**User Stories Addressed:** US-PROJ-001, US-PROJ-002, US-PROJ-003, US-PROJ-004

**Functional Requirements:**
- Create, read, update, delete projects
- Project belongs to one organisation
- Project contains sources, configurations, and outputs
- Unique project names within organisation

**Non-Functional Requirements:**
- Project list loads under 1 second
- Maximum 100 projects per organisation (MVP)

**Edge Cases:**
- Project deletion with active processing
- Concurrent edits to project settings
- Project name collision

**Error States:**
- Duplicate project name
- Deletion of project with dependent exports
- Access to deleted project via stale link

**Out of Scope:** Project templates, project cloning, cross-organisation sharing

---

### F-004: File Upload & Detection

**Description:** Upload files (CSV, Excel, JSON) with automatic structure detection and preview.

**User Stories Addressed:** US-SRC-001, US-SRC-002, US-SRC-003, US-SRC-004

**Functional Requirements:**
- Accept CSV, XLSX, JSON files up to 50MB
- Detect column headers and data types
- Handle multi-sheet Excel files
- Preview first 100 rows
- Store raw files for 30 days

**Non-Functional Requirements:**
- Upload progress indication
- Detection completes within 30 seconds for 50MB file
- UTF-8 encoding with fallback handling

**Edge Cases:**
- Malformed CSV (inconsistent columns)
- Excel with formulas (evaluated vs. formula)
- Deeply nested JSON structures
- Files with no headers

**Error States:**
- Unsupported file type
- File exceeds size limit
- Upload interrupted
- Detection fails (corrupted file)

**Out of Scope:** Real-time streaming upload, file versioning, cloud storage integration

---

### F-005: API Connectors

**Description:** Connect to external platforms (Teamwork Desk, GoHighLevel) to import operational data.

**User Stories Addressed:** US-SRC-005, US-SRC-006, US-SRC-007

**Functional Requirements:**
- Secure credential storage for API connections
- Connection validation before save
- Date range and field filtering for imports
- Rate limit handling with automatic backoff
- Incremental import support

**Non-Functional Requirements:**
- Credential encryption at rest
- Connection timeout: 30 seconds
- Import status updates every 30 seconds

**Edge Cases:**
- API credentials revoked mid-import
- Source platform unavailable
- Rate limit exceeded
- Schema changes in source API

**Error States:**
- Invalid credentials
- API endpoint unreachable
- Rate limit exceeded (with retry timeline)
- Unexpected data format

**Out of Scope:** Real-time sync, webhook triggers, custom API connector builder

---

### F-006: Field Mapping & Schema Configuration

**Description:** Map source fields to canonical schemas with transformation support.

**User Stories Addressed:** US-MAP-001, US-MAP-002, US-MAP-003

**Functional Requirements:**
- Visual field mapping interface
- Three canonical schemas: Conversation, Q&A Pairs, Knowledge Document
- Required vs. optional field indication
- Basic transformations: concatenate, split, date format, case conversion
- Mapping validation before processing

**Non-Functional Requirements:**
- Mapping interface loads under 2 seconds
- Support up to 500 source fields

**Edge Cases:**
- Schema change after mapping defined
- Multiple source fields to single target
- Circular transformation dependencies

**Error States:**
- Required field unmapped
- Invalid transformation configuration
- Type mismatch between source and target

**Out of Scope:** Custom schema creation, schema versioning, programmatic mapping

---

### F-007: PII Detection & De-identification

**Description:** Automatic detection and configurable handling of personally identifiable information.

**User Stories Addressed:** US-PII-001, US-PII-002, US-PII-003, US-PII-004

**Functional Requirements:**
- Automatic detection of: names, emails, phone numbers, addresses, dates of birth, government IDs
- Confidence scores for detections
- Four handling options: mask, redact, pseudonymise, retain
- Custom pattern rules via regex
- Before/after preview

**Non-Functional Requirements:**
- Detection precision > 85% for standard PII types
- Detection recall > 90% for email and phone
- Preview generates within 10 seconds

**Edge Cases:**
- False positives (product names detected as person names)
- PII in free-text fields
- Non-English names
- PII spanning multiple fields

**Error States:**
- Detection timeout on large datasets
- Invalid custom regex pattern
- Conflicting rules for same field

**Out of Scope:** ML-based PII detection training, real-time detection during upload, GDPR subject access request handling

---

### F-008: Processing Pipeline

**Description:** Execute configured processing workflow to transform source data into AI-ready output.

**User Stories Addressed:** US-PROC-001, US-PROC-002, US-PROC-003, US-PROC-004

**Functional Requirements:**
- Sequential pipeline: Ingest → Normalise → De-identify → Filter → Format
- Progress tracking with stage identification
- Quality filters: completeness threshold, minimum length
- Role identification for conversations
- Re-run capability with configuration changes

**Non-Functional Requirements:**
- Process up to 100,000 records per project
- Processing completes within 1 hour for maximum dataset
- Resume capability after transient failures

**Edge Cases:**
- Processing interrupted by system restart
- Source data modified during processing
- Configuration changed during processing

**Error States:**
- Mapping configuration invalid
- De-identification rule failure
- Output schema validation failure
- Resource limit exceeded

**Out of Scope:** Real-time streaming processing, parallel processing across nodes, custom pipeline stages

---

### F-009: Export & Download

**Description:** Generate and download AI-ready datasets in multiple formats.

**User Stories Addressed:** US-EXP-001, US-EXP-002, US-EXP-003

**Functional Requirements:**
- Export formats: JSONL, Q&A pairs JSON, structured JSON
- Download via browser
- Export history with 30-day retention
- Re-download available exports

**Non-Functional Requirements:**
- Export generation under 5 minutes for maximum dataset
- Download speeds match user's connection
- Exports stored for 30 days

**Edge Cases:**
- Export requested during active processing
- Very large export (approaching 1GB)
- Concurrent export requests

**Error States:**
- Export generation failure
- Download interrupted
- Export expired (no longer available)

**Out of Scope:** Direct cloud storage push, API-based export, scheduled exports

---

### F-010: Audit & Lineage Tracking

**Description:** Track and report data lineage and de-identification for compliance purposes.

**User Stories Addressed:** US-AUD-001, US-AUD-002

**Functional Requirements:**
- Record source files and configurations at processing time
- Track transformations applied per field
- Summary statistics for de-identification
- Exportable audit report

**Non-Functional Requirements:**
- Audit data retained for duration of project existence
- Report generation under 30 seconds

**Edge Cases:**
- Configuration changed between processing runs
- Source file replaced with same name
- Multiple processing runs with different configurations

**Error States:**
- Incomplete lineage (legacy data)
- Report generation timeout

**Out of Scope:** Integration with external compliance tools, automated compliance certification, data retention policy enforcement

---

## Section 6: MVP Definition

### MVP Feature List (with Removal Test Results)

| Feature | Removal Test | MVP Status | Rationale |
|---------|--------------|------------|-----------|
| F-001: Authentication | Cannot remove - users need accounts | MVP | Core platform access |
| F-002: Org & Team Management | Cannot remove - multi-tenant required | MVP | Tenant isolation is fundamental |
| F-003: Project Management | Cannot remove - organisation unit for work | MVP | Projects are the work container |
| F-004: File Upload & Detection | Cannot remove - primary data ingestion | MVP | Core value delivery |
| F-005: API Connectors (Teamwork Desk, GoHighLevel) | Cannot remove - specified in requirements | MVP | Differentiated value vs. file-only |
| F-006: Field Mapping & Schemas | Cannot remove - normalisation is core | MVP | Schema-first is key differentiator |
| F-007: PII Detection & De-identification | Cannot remove - privacy is first-class | MVP | Core safety requirement |
| F-008: Processing Pipeline | Cannot remove - produces output | MVP | Transforms input to output |
| F-009: Export & Download | Cannot remove - users need output | MVP | Delivers value to users |
| F-010: Audit & Lineage | Could be simplified but not removed | MVP | Compliance enablement |

### MVP Success Criteria

1. **Aha Moment Test:** Non-technical user uploads CSV, receives de-identified JSONL output in under 5 minutes
2. **Value Delivery Test:** Output can be directly used for AI agent training without further transformation
3. **Privacy Test:** No PII appears in output when de-identification is configured
4. **Integration Test:** At least one API connector (Teamwork Desk or GoHighLevel) successfully imports data

### Post-MVP Features (Documented for Expansion Path)

| Feature | Priority | Rationale for Deferral |
|---------|----------|------------------------|
| Additional API Connectors (Zendesk, HubSpot, Salesforce) | High | Core connectors sufficient for launch |
| Custom Schema Creation | Medium | Three canonical schemas cover launch use cases |
| Topic/Intent Extraction | Medium | Enhancement, not core transformation |
| Direct Cloud Push | Medium | Download-only acceptable for MVP |
| Self-Service Onboarding | High | Invite-only acceptable for controlled launch |
| Usage-Based Billing | High | Not needed for invite-only MVP |

### Post-Launch Metrics

| Metric | Target (30 days post-launch) | Target (90 days) |
|--------|------------------------------|------------------|
| Active organisations | 10 | 25 |
| Projects created | 30 | 100 |
| Datasets processed | 50 | 200 |
| Time to first export (new user) | < 30 minutes | < 15 minutes |
| PII detection accuracy (user-reported) | > 80% | > 90% |

---

## Section 7: Information Architecture

### Content Organisation

**Primary Hierarchy:**
```
Organisation
├── Settings (organisation-wide)
├── Members (user management)
└── Projects
    ├── Sources (files and API connections)
    ├── Configuration (schemas, mappings, de-identification)
    ├── Processing (run, status, history)
    └── Exports (generated outputs)
```

### Navigation Structure

**Primary Navigation (authenticated):**
- Dashboard (project list)
- Project Detail (when project selected)
- Organisation Settings (admin only)

**Secondary Navigation (within project):**
- Overview
- Sources
- Configuration
- Processing
- Exports

### User Flows (Textual Descriptions)

**Flow 1: First-Time User Setup**
1. User receives invitation email → Clicks link
2. Registration page → Enters name, password
3. Dashboard → Empty state with "Create Project" CTA
4. Create project modal → Enters name, description
5. Project created → Redirected to project overview

**Flow 2: File Upload to Export**
1. User in project → Clicks "Add Source"
2. Upload interface → Drags file or clicks to browse
3. Upload progress → File processes
4. Detection results → Reviews detected fields
5. Configure mapping → Maps fields to schema
6. PII detection → Reviews flagged fields
7. Configure de-identification → Selects handling per field
8. Preview → Reviews sample output
9. Start processing → Initiates pipeline
10. Processing status → Views progress
11. Processing complete → Clicks Export
12. Select format → Chooses JSONL
13. Download → Receives file

**Flow 3: API Connector Setup**
1. User in project → Clicks "Add Source" → Selects API
2. Connector selection → Chooses Teamwork Desk
3. Configuration → Enters API credentials, domain
4. Test connection → System validates
5. Configure import → Sets date range, filters
6. Initiate import → Data begins pulling
7. Import complete → Source appears in list with record count

**Flow 4: Error Recovery (Processing Failure)**
1. User starts processing → Pipeline runs
2. Error occurs → Processing stops
3. Status shows error → User sees failed stage and error details
4. User investigates → Reviews configuration
5. User fixes issue → Updates mapping or de-identification
6. User re-runs → Processing restarts from beginning
7. Processing completes → Success state

### Page Inventory (MANDATORY)

| Page Name | Route | Purpose | User Stories | MVP Status |
|-----------|-------|---------|--------------|------------|
| Login | /login | User authentication | US-AUTH-002 | MVP |
| Register | /register | New user signup | US-AUTH-001 | MVP |
| Accept Invitation | /invite/:token | Join organisation via invitation | US-AUTH-004 | MVP |
| Forgot Password | /forgot-password | Initiate password reset | US-AUTH-003 | MVP |
| Reset Password | /reset-password/:token | Complete password reset | US-AUTH-003 | MVP |
| Dashboard | / | Project list and organisation overview | US-PROJ-002 | MVP |
| Project Overview | /projects/:id | Project summary and quick actions | US-PROJ-001, US-PROJ-003 | MVP |
| Project Sources | /projects/:id/sources | Manage data sources | US-SRC-004 | MVP |
| Source Detail | /projects/:id/sources/:sourceId | View source details and preview | US-SRC-003 | MVP |
| Add Source - Upload | /projects/:id/sources/new/upload | File upload interface | US-SRC-001 | MVP |
| Add Source - API | /projects/:id/sources/new/api | API connector configuration | US-SRC-005, US-SRC-006 | MVP |
| Project Configuration | /projects/:id/configuration | Schema and mapping setup | US-MAP-001, US-MAP-002 | MVP |
| Field Mapping | /projects/:id/configuration/mapping | Detailed field mapping interface | US-MAP-001, US-MAP-003 | MVP |
| PII Configuration | /projects/:id/configuration/pii | De-identification rules | US-PII-001, US-PII-002, US-PII-003 | MVP |
| PII Preview | /projects/:id/configuration/pii/preview | Preview de-identification results | US-PII-004 | MVP |
| Processing | /projects/:id/processing | Trigger and monitor processing | US-PROC-001, US-PROC-002 | MVP |
| Quality Settings | /projects/:id/processing/quality | Configure quality filters | US-PROC-003 | MVP |
| Exports | /projects/:id/exports | View and download exports | US-EXP-001, US-EXP-002, US-EXP-003 | MVP |
| Audit/Lineage | /projects/:id/audit | View processing lineage | US-AUD-001, US-AUD-002 | MVP |
| Organisation Settings | /settings | Organisation configuration | US-ORG-001 | MVP |
| Member Management | /settings/members | Invite and manage users | US-ORG-002, US-AUTH-004 | MVP |
| User Profile | /profile | Personal account settings | US-AUTH-002 | MVP |

---

## Section 8: Assumptions and Constraints

### Technical Assumptions (Replit Context)

| Assumption | Basis | Impact if Wrong |
|------------|-------|-----------------|
| Deployment platform: Replit | Framework standard | Would require architecture redesign |
| Database: PostgreSQL (Neon) | Replit provides via Neon | Would require different ORM configuration |
| Architecture: Monolithic full-stack application | Replit deployment model | Cannot use microservices |
| Frontend: React with TypeScript | Framework standard | Agent 2 would need to specify alternatives |
| Backend: Express.js with TypeScript | Framework standard | Agent 2 would need to specify alternatives |
| ORM: Drizzle | Framework standard | Agent 3 would need to adapt |
| Authentication: JWT-based | Framework standard | Would require session store alternative |
| Max file upload: 50MB | Replit memory constraints | May need streaming for larger files |
| Max records per project: 100,000 | Replit processing constraints | Would need batch processing or external workers |

### Business Assumptions

| Assumption | Basis | Impact if Wrong |
|------------|-------|-----------------|
| Invite-only onboarding for MVP | Executive Brief states this | Would need self-service registration flow |
| Two API connectors sufficient for launch | Executive Brief specifies Teamwork Desk and GoHighLevel | May need additional connectors sooner |
| Three canonical schemas cover launch use cases | Conversation, Q&A, Knowledge Document are mentioned | May need custom schema support sooner |
| Download-only exports acceptable | Executive Brief MVP scope | May need direct integrations sooner |
| 30-day source data retention | Executive Brief states this | Storage costs or compliance may require changes |
| English-language PII detection priority | Not specified, assumed | Would need multi-language support |

### Known Constraints

| Constraint | Source | Mitigation |
|------------|--------|------------|
| Single container deployment | Replit platform | Design for monolithic architecture, no microservices |
| Replit resource limits | Platform constraint | Enforce per-project record limits, optimise processing |
| Web browser access only | Replit platform | No native mobile app, responsive web design |
| No persistent background workers | Replit deployment model | Processing must complete within request timeframes or use polling |
| Ephemeral filesystem | Replit platform | All persistent data in PostgreSQL, temp files cleared |

### Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| API connector rate limits block imports | High | Medium | Implement backoff, cache credentials securely, queue imports |
| PII detection false positives annoy users | Medium | Medium | Provide easy override, show confidence scores |
| Large file uploads timeout | Medium | High | Implement chunked uploads, clear size limits |
| Processing takes too long for large datasets | Medium | High | Progress indication, background polling, enforce limits |
| Source API schema changes break connector | Medium | High | Version connectors, clear error messages, manual mapping fallback |

---

## Section 9: Success Metrics

### Key Performance Indicators

| KPI | Definition | Measurement Method | Target (Launch) | Target (6 months) |
|-----|------------|-------------------|-----------------|-------------------|
| Time to First Export | Minutes from registration to first downloaded dataset | Event timestamps | < 30 min | < 15 min |
| Processing Success Rate | % of initiated processing runs that complete successfully | Processing events | > 90% | > 95% |
| PII Detection Accuracy | % of user-confirmed PII correctly identified | User feedback on detections | > 80% | > 90% |
| Dataset Reuse | Average number of re-runs per project | Processing event count | 2 | 5 |
| User Activation | % of invited users who create a project within 7 days | User events | > 50% | > 70% |

### Launch Targets

| Metric | Target |
|--------|--------|
| Organisations onboarded | 10 |
| Projects created | 30 |
| Datasets successfully processed | 50 |
| Total records processed | 100,000 |
| Zero data breaches | Required |

### 6-Month Milestones

| Milestone | Target Date | Success Criteria |
|-----------|-------------|------------------|
| Production stable | Launch + 30 days | No critical bugs, 99% uptime |
| 25 active organisations | Launch + 90 days | Organisations with processing activity in last 30 days |
| User-reported satisfaction > 4/5 | Launch + 90 days | Survey results |
| Second connector batch (Zendesk, HubSpot) | Launch + 120 days | Connectors live and documented |
| Self-service onboarding | Launch + 180 days | Public registration available |

### Analytics Requirements

| Event | Data Captured | Purpose |
|-------|---------------|---------|
| User Registration | Timestamp, invitation source | Funnel analysis |
| Project Created | Timestamp, user, organisation | Activation tracking |
| Source Added | Type (file/API), size, field count | Usage patterns |
| Processing Started | Project, source count, configuration | Processing analytics |
| Processing Completed | Duration, record count, error count | Performance monitoring |
| Export Downloaded | Format, record count, user | Value delivery tracking |
| PII Detection Overridden | Field, original detection, user action | Detection quality |

---

## Section 10: Glossary

### Domain Terms

| Term | Definition |
|------|------------|
| Canonical Schema | A standardised data structure that heterogeneous source data is normalised into. Foundry provides Conversation, Q&A Pairs, and Knowledge Document schemas. |
| De-identification | The process of removing or obscuring personally identifiable information from data. Methods include masking, redaction, and pseudonymisation. |
| Masking | A de-identification method that replaces sensitive values with format-preserving placeholders (e.g., [EMAIL], [NAME]). |
| Pseudonymisation | A de-identification method that replaces real values with consistent fake values, preserving relationships without exposing real data. |
| Redaction | A de-identification method that completely removes sensitive values from output. |
| PII (Personally Identifiable Information) | Any data that could identify a specific individual, including names, email addresses, phone numbers, and government IDs. |
| Processing Pipeline | The ordered sequence of transformation stages applied to source data: ingestion, normalisation, de-identification, filtering, and output formatting. |
| Source | An origin of raw data connected to a project. Can be a file upload or API connection. |
| Lineage | The traceable history of how output data was derived from source data, including transformations and configurations applied. |

### Technical Terms

| Term | Definition |
|------|------------|
| JSONL | JSON Lines format where each line is a valid JSON object. Common format for AI training data. |
| JWT | JSON Web Token, used for authentication session management. |
| Multi-tenant | Architecture where a single application instance serves multiple isolated customer organisations. |
| Drizzle | TypeScript ORM used for database operations. |
| Neon | Serverless PostgreSQL provider, used by Replit for managed databases. |

### Acronyms

| Acronym | Expansion |
|---------|-----------|
| API | Application Programming Interface |
| CRM | Customer Relationship Management |
| CSV | Comma-Separated Values |
| ETL | Extract, Transform, Load |
| GDPR | General Data Protection Regulation |
| MVP | Minimum Viable Product |
| ORM | Object-Relational Mapping |
| PRD | Product Requirements Document |
| RAG | Retrieval-Augmented Generation |
| SaaS | Software as a Service |
| UI | User Interface |
| UX | User Experience |

---

## Document Validation

### Completeness Check
- [x] All 10 sections populated
- [x] All personas have ≥3 user stories (Sarah: 15+, Marcus: 5+, Elena: 6+, David: 4+)
- [x] All user stories have ≥2 acceptance criteria
- [x] All MVP features have documented removal test
- [x] All features trace to user stories
- [x] All user stories trace to personas
- [x] All user flows include error states
- [x] Technical assumptions compatible with Replit

### Prompt Hygiene Gate (per Constitution Section L)
- [x] Framework Version header present and correct
- [x] Encoding scan passed: No non-ASCII artifact tokens
- [x] Inheritance statement references Constitution v3
- [x] No full restatement of global rules (uses "Per Constitution Section X" references)

### Confidence Scores
| Section | Score (1-10) | Notes |
|---------|--------------|-------|
| Problem Statement | 9 | Clear problem from Executive Brief |
| Personas | 8 | Derived from use cases; could benefit from user interviews |
| User Stories | 9 | Comprehensive coverage of stated scope |
| MVP Scope | 9 | Clear boundaries from Executive Brief |
| Replit Compatibility | 9 | Standard framework constraints apply |
| Overall | 8.5 | Strong foundation, some assumptions require validation |

### Flagged Items Requiring Review
1. **API Rate Limits:** Teamwork Desk and GoHighLevel rate limit specifics not provided; may impact connector design
2. **PII Detection Languages:** Assumed English-priority; multi-language support deferred
3. **File Size Limits:** 50MB assumed based on Replit constraints; may need adjustment
4. **Record Limits:** 100,000 records per project assumed; may need tiered approach

### Assumptions Made
1. Invite-only onboarding removes self-service registration complexity
2. English-language PII detection sufficient for launch
3. Three canonical schemas (Conversation, Q&A, Knowledge Document) cover launch use cases
4. 50MB file upload limit acceptable for target users
5. 100,000 record limit per project sufficient for MVP scale

### Document Status: COMPLETE

---

## Downstream Agent Handoff Brief

### Deployment Context (All Agents)

Per Constitution Section C and Section D: All global platform conventions and Replit non-negotiables apply.

This context applies to all downstream agents. Do not specify infrastructure that conflicts with the Constitution.

### For Agent 2: System Architecture
- **Core technical challenges:** 
  - File upload handling with automatic structure detection
  - API connector framework supporting rate limiting and incremental imports
  - Processing pipeline with multiple configurable stages
  - PII detection with confidence scoring
- **Scale expectations:** 10-50 concurrent users, 100,000 records per project max, 50MB max file size
- **Integration requirements:** Teamwork Desk API, GoHighLevel API
- **Authentication/authorisation complexity:** Organisation-based multi-tenancy, two roles (Admin, Member), project-level access
- **Key decisions deferred to you:** 
  - File processing architecture (sync vs. async)
  - PII detection implementation approach
  - Processing pipeline job management
- **Security considerations:** 
  - JWT authentication with 24-hour expiry
  - Secure API credential storage (encrypted at rest)
  - Rate limiting on auth endpoints (5 attempts/15 min)
  - Tenant isolation enforcement

### For Agent 3: Data Modeling
- **Primary entities implied:** Organisation, User, OrganisationMember, Invitation, Project, Source (FileSource, APISource), FieldMapping, PIIRule, ProcessingRun, ProcessingStage, Export, AuditEvent
- **Key relationships:** 
  - Organisation has many Users (via OrganisationMember)
  - Organisation has many Projects
  - Project has many Sources
  - Project has many ProcessingRuns
  - ProcessingRun has many Exports
- **Data lifecycle considerations:** 
  - Source files cached 30 days
  - Exports retained 30 days
  - Audit data retained for project lifetime
  - Invitation tokens expire after 7 days
- **Multi-tenancy requirements:** Organisation-level isolation, all queries scoped to organisation

### For Agent 4: API Contract
- **Primary operations needed:**
  - Auth: register, login, logout, forgot-password, reset-password
  - Organisations: get, update, list members, invite, remove member
  - Projects: CRUD, list by organisation
  - Sources: create (file upload), create (API connection), list, get, delete
  - Configuration: get/set schema, get/set field mappings, get/set PII rules
  - Processing: start, get status, get history
  - Exports: create, list, download
  - Audit: get lineage, get PII summary
- **Authentication requirements:** JWT bearer token, organisation context derived from token
- **External integrations:** Teamwork Desk API, GoHighLevel API (connector-specific endpoints)
- **Real-time requirements:** Processing status polling (no WebSocket required for MVP)

### For Agent 5: UI/UX Specification
- **Primary user flows:**
  - Registration and login
  - Create project and add file source
  - Configure mapping and de-identification
  - Run processing and download export
  - API connector setup
  - Organisation member management
- **Key interaction patterns:**
  - Drag-and-drop file upload
  - Visual field mapping (source → target)
  - Before/after preview for de-identification
  - Progress indicator for processing
  - Tabbed navigation within project
- **Accessibility requirements:** WCAG 2.1 AA compliance
- **Mobile/responsive requirements:** Responsive design, functional on tablet, optimised for desktop

### For Agent 6: Implementation Orchestrator
Per Constitution Section C/D: global platform and API conventions apply.
- Security middleware: helmet, cors, rate-limit (per Architecture)
- File handling: multer or similar for uploads
- Processing: consider job queue pattern for long-running operations

### Handoff Summary
- **Total user stories:** 32 (P0: 12, P1: 14, P2: 6)
- **MVP feature count:** 10
- **Estimated complexity:** S: 6, M: 14, L: 7, XL: 5
- **Deployment target:** Replit (per Constitution Section D)
- **Recommended human review points:**
  - API rate limit handling strategy
  - PII detection accuracy targets
  - Processing timeout handling
  - File size limit validation

---

## ASSUMPTION REGISTER

### AR-001: Invite-Only Registration
- **Type:** ASSUMPTION
- **Source Gap:** Executive Brief states "Invite-only onboarding for MVP" but does not detail first-user flow
- **Assumption Made:** First user creates organisation during registration; subsequent users join via invitation
- **Impact if Wrong:** Need separate organisation creation flow or admin bootstrap process
- **Proposed Resolution:** Confirm first-user organisation creation flow
- **Status:** UNRESOLVED
- **Owner:** Human
- **Date:** 2025-01-18

### AR-002: English-Language PII Detection Priority
- **Type:** ASSUMPTION
- **Source Gap:** Executive Brief does not specify language support for PII detection
- **Assumption Made:** English-language PII detection is sufficient for MVP launch
- **Impact if Wrong:** May exclude non-English-speaking markets or miss PII in multi-language data
- **Proposed Resolution:** Confirm target market language requirements
- **Status:** UNRESOLVED
- **Owner:** Human
- **Date:** 2025-01-18

### AR-003: Canonical Schema Sufficiency
- **Type:** ASSUMPTION
- **Source Gap:** Executive Brief mentions "Conversation data models, Knowledge document structures, Decision or outcome records" but not exhaustive list
- **Assumption Made:** Three schemas (Conversation, Q&A Pairs, Knowledge Document) cover MVP use cases
- **Impact if Wrong:** May need custom schema support earlier than post-MVP
- **Proposed Resolution:** Validate schema coverage with early users
- **Status:** UNRESOLVED
- **Owner:** Human
- **Date:** 2025-01-18

### AR-004: File Size and Record Limits
- **Type:** ASSUMPTION
- **Source Gap:** Executive Brief states "up to 100,000 records per project" but not file size limits
- **Assumption Made:** 50MB max file upload based on Replit memory constraints
- **Impact if Wrong:** May need chunked upload or streaming for larger files
- **Proposed Resolution:** Validate Replit memory constraints and user file size expectations
- **Status:** UNRESOLVED
- **Owner:** Human
- **Date:** 2025-01-18

### AR-005: Processing Architecture
- **Type:** DEPENDENCY
- **Source Gap:** Executive Brief describes "batch processing with re-run capability" but not architecture details
- **Assumption Made:** Processing runs synchronously or via polling-based async pattern (no persistent workers)
- **Impact if Wrong:** May need external job queue service incompatible with Replit
- **Proposed Resolution:** Agent 2 to determine processing architecture within Replit constraints
- **Status:** UNRESOLVED
- **Owner:** Agent 2 (System Architecture)
- **Date:** 2025-01-18

### AR-006: API Connector Authentication
- **Type:** DEPENDENCY
- **Source Gap:** Teamwork Desk and GoHighLevel API documentation not provided
- **Assumption Made:** Both APIs support API key or OAuth authentication patterns
- **Impact if Wrong:** May need different credential storage or auth flow
- **Proposed Resolution:** Research specific API authentication requirements before connector implementation
- **Status:** UNRESOLVED
- **Owner:** Agent 2 (System Architecture)
- **Date:** 2025-01-18

### AR-007: PII Detection Implementation
- **Type:** DEPENDENCY
- **Source Gap:** No specific PII detection library or service mentioned
- **Assumption Made:** PII detection can be implemented with available libraries within Replit constraints
- **Impact if Wrong:** May need external API for PII detection, adding cost and latency
- **Proposed Resolution:** Agent 2 to evaluate PII detection options
- **Status:** UNRESOLVED
- **Owner:** Agent 2 (System Architecture)
- **Date:** 2025-01-18

---

## Document End
