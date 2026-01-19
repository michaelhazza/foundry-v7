/**
 * Audit routes.
 * Per API Contract Section 4.8: Audit Endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { sendSuccess, sendPaginated } from '../lib/response';
import { parseIntParam, parsePagination } from '../lib/validation';
import { authMiddleware } from '../middleware/auth.middleware';
import * as auditService from '../services/audit.service';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/projects/:projectId/audit/events
router.get('/projects/:projectId/audit/events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = parseIntParam(req.params.projectId, 'projectId');
    const { page, limit } = parsePagination(req.query);
    const eventType = req.query.eventType as string | undefined;

    const result = await auditService.listEvents(projectId, req.user!.organisationId, {
      page,
      limit,
      eventType,
    });
    sendPaginated(res, result.data, { page, limit, total: result.total });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:projectId/audit/lineage
router.get('/projects/:projectId/audit/lineage', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = parseIntParam(req.params.projectId, 'projectId');
    const lineage = await auditService.getLineage(projectId, req.user!.organisationId);
    sendSuccess(res, lineage);
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:projectId/audit/pii-summary
router.get('/projects/:projectId/audit/pii-summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = parseIntParam(req.params.projectId, 'projectId');
    const summary = await auditService.getPiiSummary(projectId, req.user!.organisationId);
    sendSuccess(res, summary);
  } catch (error) {
    next(error);
  }
});

// GET /api/processing/runs/:runId/audit/lineage
router.get('/processing/runs/:runId/audit/lineage', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const runId = parseIntParam(req.params.runId, 'runId');
    const lineage = await auditService.getRunLineage(runId, req.user!.organisationId);
    sendSuccess(res, lineage);
  } catch (error) {
    next(error);
  }
});

export default router;
