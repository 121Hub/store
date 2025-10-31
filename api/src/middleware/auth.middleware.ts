import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/token.service';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const claims = verifyAccessToken(token);
    req.user = claims;
    next();
  } catch (e: unknown) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
