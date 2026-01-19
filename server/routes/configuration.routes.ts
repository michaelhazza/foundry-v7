/**
 * Configuration routes.
 * Per API Contract Section 4.5: Configuration Endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendSuccess, sendNoContent } from '../lib/response';
import { parseIntParam } from '../lib/validation';
import { authMiddleware } from '../middleware/auth.middleware';
import * as mappingService from '../services/mapping.service';
import * as piiService from '../services/pii.service';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Validation schemas
const updateSchemaSchema = z.object({
  targetSchema: z.enum(['qa_pairs', 'instruction', 'chat', 'structured', 'custom']),
  customSchema: z.object({
    fields: z.array(z.object({
      name: z.string(),
      type: z.string(),
      required: z.boolean().optional(),
    })),
  }).optional(),
});

const createMappingSchema = z.object({
  sourceFieldId: z.number().int().positive(),
  targetField: z.string().min(1),
  transformation: z.object({
    type: z.enum(['direct', 'concatenate', 'template', 'format']).optional(),
    config: z.record(z.unknown()).optional(),
  }).optional(),
});

const updateMappingSchema = z.object({
  targetField: z.string().min(1).optional(),
  transformation: z.object({
    type: z.enum(['direct', 'concatenate', 'template', 'format']).optional(),
    config: z.record(z.unknown()).optional(),
  }).optional(),
  isActive: z.boolean().optional(),
});

const createPiiRuleSchema = z.object({
  sourceFieldId: z.number().int().positive(),
  piiType: z.enum(['email', 'phone', 'name', 'address', 'ssn', 'credit_card', 'custom']),
  handling: z.enum(['mask', 'redact', 'hash', 'keep']),
  customPattern: z.string().optional(),
});

const updatePiiRuleSchema = z.object({
  handling: z.enum(['mask', 'redact', 'hash', 'keep']).optional(),
  customPattern: z.string().optional(),
});

// GET /api/projects/:projectId/schema
router.get('/projects/:projectId/schema', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = parseIntParam(req.params.projectId, 'projectId');
    const schema = await mappingService.getProjectSchema(projectId, req.user!.organisationId);
    sendSuccess(res, schema);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/projects/:projectId/schema
router.patch('/projects/:projectId/schema', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = parseIntParam(req.params.projectId, 'projectId');
    const data = updateSchemaSchema.parse(req.body);
    const schema = await mappingService.updateProjectSchema(projectId, req.user!.organisationId, data);
    sendSuccess(res, schema);
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:projectId/mappings
router.get('/projects/:projectId/mappings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = parseIntParam(req.params.projectId, 'projectId');
    const mappings = await mappingService.getMappings(projectId, req.user!.organisationId);
    sendSuccess(res, mappings);
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:projectId/mappings
router.post('/projects/:projectId/mappings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = parseIntParam(req.params.projectId, 'projectId');
    const data = createMappingSchema.parse(req.body);
    const mapping = await mappingService.createMapping(projectId, req.user!.organisationId, data);
    sendSuccess(res, mapping, 201);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/mappings/:id
router.patch('/mappings/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mappingId = parseIntParam(req.params.id, 'id');
    const data = updateMappingSchema.parse(req.body);
    const mapping = await mappingService.updateMapping(mappingId, req.user!.organisationId, data);
    sendSuccess(res, mapping);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/mappings/:id
router.delete('/mappings/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mappingId = parseIntParam(req.params.id, 'id');
    await mappingService.deleteMapping(mappingId, req.user!.organisationId);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

// POST /api/sources/:sourceId/pii/detect
router.post('/sources/:sourceId/pii/detect', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sourceId = parseIntParam(req.params.sourceId, 'sourceId');
    const detected = await piiService.detectPii(sourceId, req.user!.organisationId);
    sendSuccess(res, detected);
  } catch (error) {
    next(error);
  }
});

// GET /api/sources/:sourceId/pii/rules
router.get('/sources/:sourceId/pii/rules', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sourceId = parseIntParam(req.params.sourceId, 'sourceId');
    const rules = await piiService.getPiiRules(sourceId, req.user!.organisationId);
    sendSuccess(res, rules);
  } catch (error) {
    next(error);
  }
});

// POST /api/sources/:sourceId/pii/rules
router.post('/sources/:sourceId/pii/rules', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sourceId = parseIntParam(req.params.sourceId, 'sourceId');
    const data = createPiiRuleSchema.parse(req.body);
    const rule = await piiService.createPiiRule(sourceId, req.user!.organisationId, data);
    sendSuccess(res, rule, 201);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/pii/rules/:id
router.patch('/pii/rules/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ruleId = parseIntParam(req.params.id, 'id');
    const data = updatePiiRuleSchema.parse(req.body);
    const rule = await piiService.updatePiiRule(ruleId, req.user!.organisationId, data);
    sendSuccess(res, rule);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/pii/rules/:id
router.delete('/pii/rules/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ruleId = parseIntParam(req.params.id, 'id');
    await piiService.deletePiiRule(ruleId, req.user!.organisationId);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

// GET /api/sources/:sourceId/pii/preview
router.get('/sources/:sourceId/pii/preview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sourceId = parseIntParam(req.params.sourceId, 'sourceId');
    const limit = parseInt(req.query.limit as string) || 10;
    const preview = await piiService.previewPii(sourceId, req.user!.organisationId, limit);
    sendSuccess(res, preview);
  } catch (error) {
    next(error);
  }
});

export default router;
