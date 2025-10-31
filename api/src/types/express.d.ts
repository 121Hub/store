import { JwtPayload } from '../middleware/auth.middleware';
import { UserTenant } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      tenantMembership?: UserTenant;
    }
  }
}
