/**
 * Export routes.
 * Per API Contract Section 4.7: Export Endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendSuccess, sendPaginated, sendNoContent } from '../lib/response';
import { parseIntParam, parsePagination } from '../lib/validation';
import { authMiddleware } from '../middleware/auth.middleware';
import * as exportService from '../services/export.service';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Validation schemas
const createExportSchema = z.object({
  format: z.enum(['jsonl', 'csv', 'parquet']),
});

// POST /api/processing/runs/:runId/exports
router.post('/processing/runs/:runId/exports', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const runId = parseIntParam(req.params.runId, 'runId');
    const data = createExportSchema.parse(req.body);
    const exportRecord = await exportService.createExport(
      runId,
      req.user!.organisationId,
      req.user!.id,
      data.format
    );
    sendSuccess(res, exportRecord, 201);
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:projectId/exports
router.get('/projects/:projectId/exports', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = parseIntParam(req.params.projectId, 'projectId');
    const { page, limit } = parsePagination(req.query);
    const result = await exportService.listExports(projectId, req.user!.organisationId, { page, limit });
    sendPaginated(res, result.data, { page, limit, total: result.total });
  } catch (error) {
    next(error);
  }
});

// GET /api/exports/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exportId = parseIntParam(req.params.id, 'id');
    const exportRecord = await exportService.getExport(exportId, req.user!.organisationId);
    sendSuccess(res, exportRecord);
  } catch (error) {
    next(error);
  }
});

// GET /api/exports/:id/download
router.get('/:id/download', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exportId = parseIntParam(req.params.id, 'id');
    const { stream, fileName, mimeType } = await exportService.downloadExport(
      exportId,
      req.user!.organisationId
    );

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/exports/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exportId = parseIntParam(req.params.id, 'id');
    await exportService.deleteExport(exportId, req.user!.organisationId);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

export default router;
