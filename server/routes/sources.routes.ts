/**
 * Source routes.
 * Per API Contract Section 4.4: Source Endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { sendSuccess, sendPaginated, sendNoContent } from '../lib/response';
import { parseIntParam, parsePagination } from '../lib/validation';
import { authMiddleware } from '../middleware/auth.middleware';
import { UnsupportedFileTypeError, FileTooLargeError } from '../errors';
import * as sourceService from '../services/source.service';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/json'];
    const allowedExtensions = ['.csv', '.xlsx', '.xls', '.json'];

    const extension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(new UnsupportedFileTypeError());
    }
  },
});

// Validation schemas
const createApiSourceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  connectorType: z.enum(['teamwork', 'gohighlevel']),
  connectorConfig: z.object({
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
    baseUrl: z.string().url().optional(),
    accountId: z.string().optional(),
  }),
});

const testConnectorSchema = z.object({
  connectorType: z.enum(['teamwork', 'gohighlevel']),
  connectorConfig: z.object({
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
    baseUrl: z.string().url().optional(),
    accountId: z.string().optional(),
  }),
});

// GET /api/projects/:projectId/sources
router.get('/projects/:projectId/sources', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = parseIntParam(req.params.projectId, 'projectId');
    const { page, limit } = parsePagination(req.query);
    const result = await sourceService.listSources(projectId, req.user!.organisationId, { page, limit });
    sendPaginated(res, result.data, { page, limit, total: result.total });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:projectId/sources/upload
router.post('/projects/:projectId/sources/upload', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = parseIntParam(req.params.projectId, 'projectId');

    if (!req.file) {
      throw new UnsupportedFileTypeError();
    }

    const source = await sourceService.uploadSource(
      projectId,
      req.user!.organisationId,
      req.file
    );
    sendSuccess(res, source, 201);
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:projectId/sources/api
router.post('/projects/:projectId/sources/api', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = parseIntParam(req.params.projectId, 'projectId');
    const data = createApiSourceSchema.parse(req.body);
    const source = await sourceService.createApiSource(
      projectId,
      req.user!.organisationId,
      data
    );
    sendSuccess(res, source, 201);
  } catch (error) {
    next(error);
  }
});

// POST /api/sources/test-connector
router.post('/test-connector', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = testConnectorSchema.parse(req.body);
    const result = await sourceService.testConnector(data.connectorType, data.connectorConfig);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

// GET /api/sources/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sourceId = parseIntParam(req.params.id, 'id');
    const source = await sourceService.getSource(sourceId, req.user!.organisationId);
    sendSuccess(res, source);
  } catch (error) {
    next(error);
  }
});

// GET /api/sources/:id/preview
router.get('/:id/preview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sourceId = parseIntParam(req.params.id, 'id');
    const limit = parseInt(req.query.limit as string) || 10;
    const preview = await sourceService.getSourcePreview(sourceId, req.user!.organisationId, limit);
    sendSuccess(res, preview);
  } catch (error) {
    next(error);
  }
});

// GET /api/sources/:id/fields
router.get('/:id/fields', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sourceId = parseIntParam(req.params.id, 'id');
    const fields = await sourceService.getSourceFields(sourceId, req.user!.organisationId);
    sendSuccess(res, fields);
  } catch (error) {
    next(error);
  }
});

// POST /api/sources/:id/sync
router.post('/:id/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sourceId = parseIntParam(req.params.id, 'id');
    const result = await sourceService.syncSource(sourceId, req.user!.organisationId);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/sources/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sourceId = parseIntParam(req.params.id, 'id');
    await sourceService.deleteSource(sourceId, req.user!.organisationId);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

export default router;
