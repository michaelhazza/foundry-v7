/**
 * Response envelope helpers for consistent API responses.
 * Per Constitution Section C: All responses use standard envelope format.
 */

import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface Meta {
  timestamp: string;
  requestId: string;
}

interface SuccessEnvelope<T> {
  data: T;
  meta: Meta;
}

interface PaginatedEnvelope<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  meta: Meta;
}

interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
  };
}

/**
 * Create metadata for response envelope.
 */
function createMeta(): Meta {
  return {
    timestamp: new Date().toISOString(),
    requestId: uuidv4(),
  };
}

/**
 * Send a success response with data envelope.
 * @param res - Express response object
 * @param data - Payload to send
 * @param status - HTTP status code (default 200)
 */
export function sendSuccess<T>(res: Response, data: T, status = 200): void {
  const envelope: SuccessEnvelope<T> = {
    data,
    meta: createMeta(),
  };
  res.status(status).json(envelope);
}

/**
 * Send a paginated response with pagination envelope.
 * @param res - Express response object
 * @param data - Array of items
 * @param pagination - Pagination info
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: { page: number; limit: number; total: number }
): void {
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const envelope: PaginatedEnvelope<T> = {
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages,
      hasMore: pagination.page < totalPages,
    },
    meta: createMeta(),
  };
  res.status(200).json(envelope);
}

/**
 * Send an error response with error envelope.
 * @param res - Express response object
 * @param code - Error code from Error Codes Registry
 * @param message - Human-readable error message
 * @param status - HTTP status code
 */
export function sendError(res: Response, code: string, message: string, status: number): void {
  const envelope: ErrorEnvelope = {
    error: {
      code,
      message,
    },
  };
  res.status(status).json(envelope);
}

/**
 * Send a 204 No Content response.
 * @param res - Express response object
 */
export function sendNoContent(res: Response): void {
  res.status(204).send();
}
