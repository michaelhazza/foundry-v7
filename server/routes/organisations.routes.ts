/**
 * Organisation routes.
 * Per API Contract Section 4.2: Organisation Endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendSuccess, sendPaginated, sendNoContent } from '../lib/response';
import { parseIntParam, parsePagination } from '../lib/validation';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import * as orgService from '../services/org.service';
import * as invitationService from '../services/invitation.service';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Validation schemas
const updateOrgSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
});

const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member']).default('member'),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'member']),
});

// GET /api/organisations/current
router.get('/current', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const org = await orgService.getOrganisation(req.user!.organisationId);
    sendSuccess(res, org);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/organisations/current
router.patch('/current', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateOrgSchema.parse(req.body);
    const org = await orgService.updateOrganisation(req.user!.organisationId, data);
    sendSuccess(res, org);
  } catch (error) {
    next(error);
  }
});

// GET /api/organisations/current/members
router.get('/current/members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const result = await orgService.getMembers(req.user!.organisationId, { page, limit });
    sendPaginated(res, result.data, { page, limit, total: result.total });
  } catch (error) {
    next(error);
  }
});

// POST /api/organisations/current/invitations
router.post('/current/invitations', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = inviteMemberSchema.parse(req.body);
    const invitation = await invitationService.createInvitation({
      ...data,
      organisationId: req.user!.organisationId,
      invitedById: req.user!.id,
    });
    sendSuccess(res, invitation, 201);
  } catch (error) {
    next(error);
  }
});

// GET /api/organisations/current/invitations
router.get('/current/invitations', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const result = await invitationService.getInvitations(req.user!.organisationId, { page, limit });
    sendPaginated(res, result.data, { page, limit, total: result.total });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/organisations/current/invitations/:id
router.delete('/current/invitations/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invitationId = parseIntParam(req.params.id, 'id');
    await invitationService.cancelInvitation(invitationId, req.user!.organisationId);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/organisations/current/members/:id
router.patch('/current/members/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberId = parseIntParam(req.params.id, 'id');
    const data = updateMemberRoleSchema.parse(req.body);
    const member = await orgService.updateMemberRole(
      req.user!.organisationId,
      memberId,
      data.role,
      req.user!.id
    );
    sendSuccess(res, member);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/organisations/current/members/:id
router.delete('/current/members/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberId = parseIntParam(req.params.id, 'id');
    await orgService.removeMember(req.user!.organisationId, memberId, req.user!.id);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

// GET /api/invitations/:token (public - for invitation preview)
router.get('/invitations/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invitation = await invitationService.getInvitationByToken(req.params.token);
    sendSuccess(res, invitation);
  } catch (error) {
    next(error);
  }
});

// POST /api/invitations/:token/accept
router.post('/invitations/:token/accept', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await invitationService.acceptInvitation(req.params.token, req.user?.id);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

export default router;
