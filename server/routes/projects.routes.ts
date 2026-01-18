/**
 * Project routes.
 * Per API Contract Section 4.3: Project Endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendSuccess, sendPaginated, sendNoContent } from '../lib/response';
import { parseIntParam, parsePagination } from '../lib/validation';
import { authMiddleware } from '../middleware/auth.middleware';
import * as projectService from '../services/project.service';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  targetSchema: z.enum(['qa_pairs', 'instruction', 'chat', 'structured', 'custom']).optional(),
});

// GET /api/projects
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const status = req.query.status as string | undefined;
    const result = await projectService.listProjects(req.user!.organisationId, { page, limit, status });
    sendPaginated(res, result.data, { page, limit, total: result.total });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createProjectSchema.parse(req.body);
    const project = await projectService.createProject({
      ...data,
      organisationId: req.user!.organisationId,
      createdById: req.user!.id,
    });
    sendSuccess(res, project, 201);
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = parseIntParam(req.params.id, 'id');
    const project = await projectService.getProject(projectId, req.user!.organisationId);
    sendSuccess(res, project);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/projects/:id
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = parseIntParam(req.params.id, 'id');
    const data = updateProjectSchema.parse(req.body);
    const project = await projectService.updateProject(projectId, req.user!.organisationId, data);
    sendSuccess(res, project);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = parseIntParam(req.params.id, 'id');
    await projectService.deleteProject(projectId, req.user!.organisationId);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id/stats
router.get('/:id/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = parseIntParam(req.params.id, 'id');
    const stats = await projectService.getProjectStats(projectId, req.user!.organisationId);
    sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
});

export default router;
