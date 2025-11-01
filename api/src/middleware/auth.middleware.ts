import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/token.service';

/**
 * Require authentication middleware.
 * Reads access_token from HTTP-only cookie.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies['access_token'];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const claims = verifyAccessToken(token);
    req.user = claims;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
