/**
 * Processing routes.
 * Per API Contract Section 4.6: Processing Endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendSuccess, sendPaginated, sendNoContent } from '../lib/response';
import { parseIntParam, parsePagination } from '../lib/validation';
import { authMiddleware } from '../middleware/auth.middleware';
import * as processingService from '../services/processing.service';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Validation schemas
const startProcessingSchema = z.object({
  qualitySettings: z.object({
    minLength: z.number().int().min(0).optional(),
    maxLength: z.number().int().positive().optional(),
    removeDuplicates: z.boolean().optional(),
    removeEmpty: z.boolean().optional(),
  }).optional(),
});

// POST /api/projects/:projectId/processing/start
router.post('/projects/:projectId/processing/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = parseIntParam(req.params.projectId, 'projectId');
    const data = startProcessingSchema.parse(req.body);
    const run = await processingService.startProcessing(
      projectId,
      req.user!.organisationId,
      req.user!.id,
      data.qualitySettings
    );
    sendSuccess(res, run, 201);
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:projectId/processing/runs
router.get('/projects/:projectId/processing/runs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = parseIntParam(req.params.projectId, 'projectId');
    const { page, limit } = parsePagination(req.query);
    const result = await processingService.listRuns(projectId, req.user!.organisationId, { page, limit });
    sendPaginated(res, result.data, { page, limit, total: result.total });
  } catch (error) {
    next(error);
  }
});

// GET /api/processing/runs/:id
router.get('/runs/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const runId = parseIntParam(req.params.id, 'id');
    const run = await processingService.getRun(runId, req.user!.organisationId);
    sendSuccess(res, run);
  } catch (error) {
    next(error);
  }
});

// GET /api/processing/runs/:id/stages
router.get('/runs/:id/stages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const runId = parseIntParam(req.params.id, 'id');
    const stages = await processingService.getRunStages(runId, req.user!.organisationId);
    sendSuccess(res, stages);
  } catch (error) {
    next(error);
  }
});

// POST /api/processing/runs/:id/cancel
router.post('/runs/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const runId = parseIntParam(req.params.id, 'id');
    const run = await processingService.cancelRun(runId, req.user!.organisationId);
    sendSuccess(res, run);
  } catch (error) {
    next(error);
  }
});

export default router;
