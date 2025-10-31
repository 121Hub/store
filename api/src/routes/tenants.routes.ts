import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireTenantRole, TenantRole } from '../middleware/rbac.middleware';
import * as Dashboard from '../controllers/dashboard.controller';

const router = Router();

router.get(
  '/:tenantId/dashboard',
  requireAuth,
  requireTenantRole(['TENANT_ADMIN'] as TenantRole[]),
  Dashboard.tenantDashboard
);

export default router;
