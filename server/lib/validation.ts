/**
 * Parameter validation utilities for Express routes.
 * Prevents NaN database errors from invalid ID parameters.
 * @see API Contract Section 3: INVALID_ID error code
 */

import { BadRequestError } from '../errors';

/**
 * Parse and validate an integer path parameter.
 * @param value - The raw parameter value from req.params
 * @param paramName - Name of the parameter for error messages
 * @returns The parsed integer
 * @throws BadRequestError if value is not a valid positive integer
 */
export function parseIntParam(value: string | undefined, paramName: string): number {
  if (value === undefined || value === null || value === '') {
    throw new BadRequestError(`Missing required parameter: ${paramName}`, 'INVALID_ID');
  }

  const parsed = parseInt(value, 10);

  if (isNaN(parsed)) {
    throw new BadRequestError(`Invalid ${paramName}: must be a number`, 'INVALID_ID');
  }

  if (parsed <= 0) {
    throw new BadRequestError(`Invalid ${paramName}: must be a positive integer`, 'INVALID_ID');
  }

  if (!Number.isInteger(parsed)) {
    throw new BadRequestError(`Invalid ${paramName}: must be an integer`, 'INVALID_ID');
  }

  return parsed;
}

/**
 * Parse and validate an optional integer query parameter.
 * @param value - The raw query parameter value
 * @param paramName - Name of the parameter for error messages
 * @param defaultValue - Value to return if parameter is not provided
 * @returns The parsed integer or default value
 * @throws BadRequestError if value is provided but not a valid positive integer
 */
export function parseQueryInt(
  value: string | undefined,
  paramName: string,
  defaultValue: number
): number {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const parsed = parseInt(value, 10);

  if (isNaN(parsed)) {
    throw new BadRequestError(`Invalid ${paramName}: must be a number`, 'VALIDATION_ERROR');
  }

  if (parsed < 0) {
    throw new BadRequestError(`Invalid ${paramName}: must be non-negative`, 'VALIDATION_ERROR');
  }

  return parsed;
}

/**
 * Parse pagination parameters from query string.
 * @param query - Express query object
 * @returns Parsed page and limit with defaults
 */
export function parsePagination(query: Record<string, unknown>): { page: number; limit: number } {
  const page = parseQueryInt(query.page as string | undefined, 'page', 1);
  const limit = parseQueryInt(query.limit as string | undefined, 'limit', 20);

  return {
    page: Math.max(1, page),
    limit: Math.min(100, Math.max(1, limit)),
  };
}
