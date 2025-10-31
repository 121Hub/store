import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prismaClient';

export enum PlatformRole {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
}
export enum TenantRole {
  TENANT_ADMIN = 'TENANT_ADMIN',
  TEAM_MEMBER = 'TEAM_MEMBER',
  CUSTOMER = 'CUSTOMER',
}

export function requirePlatformRole(...roles: PlatformRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const assignments = await prisma.roleAssignment.findMany({
        where: { userId: user.sub, scope: 'platform' },
      });
      const has = assignments.some((a) =>
        roles.includes(a.role as PlatformRole)
      );
      if (!has) return res.status(403).json({ error: 'Forbidden' });
      next();
    } catch (e) {
      return res.status(500).json({ error: 'Role check failed' });
    }
  };
}

export function requireTenantRole(
  roles: TenantRole[] | 'any',
  tenantIdParam = 'tenantId'
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const tenantId = req.params[tenantIdParam] || req.body[tenantIdParam];
    if (!tenantId) return res.status(400).json({ error: 'Missing tenantId' });

    const membership = await prisma.userTenant.findFirst({
      where: { userId: user.sub, tenantId },
    });
    if (!membership)
      return res.status(403).json({ error: 'Not a member of tenant' });

    if (roles !== 'any' && !roles.includes(membership.role as TenantRole)) {
      return res.status(403).json({ error: 'Insufficient role' });
    }
    req.tenantMembership = membership;
    next();
  };
}
