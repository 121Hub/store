import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../prismaClient';
import config from '../config';

export function generateAccessToken(
  userId: string,
  tenantId?: string,
  roles: string[] = []
) {
  const payload = { sub: userId, tid: tenantId || null, roles };

  const expires = (config.jwtAccessExp ?? '15m') as SignOptions['expiresIn'];
  const options: SignOptions = {
    expiresIn: expires,
  };
  return jwt.sign(payload, config.jwtSecret, options);
}

export function generateRefreshTokenRaw() {
  return crypto.randomBytes(48).toString('hex');
}

export async function storeRefreshToken(
  userId: string,
  rawToken: string,
  ip?: string,
  userAgent?: string
) {
  const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(
    Date.now() + config.jwtRefreshTtlDays * 24 * 60 * 60 * 1000
  );
  const token = await prisma.refreshToken.create({
    data: { userId, tokenHash: hash, expiresAt, ip, userAgent },
  });
  return token;
}

export async function revokeAllForUser(userId: string) {
  await prisma.refreshToken.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  });
}
