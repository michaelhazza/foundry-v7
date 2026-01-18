/**
 * Application error class hierarchy.
 * Maps to API Contract Section 3: Error Codes Registry.
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, code = 'BAD_REQUEST') {
    super(message, 400, code);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', code = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

export class TokenExpiredError extends AppError {
  constructor() {
    super('Token has expired', 401, 'TOKEN_EXPIRED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = 'DUPLICATE_NAME') {
    super(message, 409, code);
  }
}

export class DuplicateEmailError extends AppError {
  constructor() {
    super('Email already registered', 409, 'DUPLICATE_EMAIL');
  }
}

export class InvitationExpiredError extends AppError {
  constructor() {
    super('Invitation has expired', 410, 'INVITATION_EXPIRED');
  }
}

export class TokenInvalidError extends AppError {
  constructor() {
    super('Token is invalid or expired', 410, 'TOKEN_INVALID');
  }
}

export class FileTooLargeError extends AppError {
  constructor() {
    super('File exceeds maximum size limit (50MB)', 413, 'UPLOAD_TOO_LARGE');
  }
}

export class UnsupportedFileTypeError extends AppError {
  constructor() {
    super('Unsupported file type. Accepted: CSV, XLSX, JSON', 415, 'UNSUPPORTED_FILE_TYPE');
  }
}

export class ProcessingInProgressError extends AppError {
  constructor() {
    super('Processing already in progress', 423, 'PROCESSING_IN_PROGRESS');
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super('Rate limit exceeded. Please try again later.', 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export class InternalError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500, 'INTERNAL_ERROR', false);
  }
}
