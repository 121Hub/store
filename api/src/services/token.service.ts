import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../prismaClient';
import config from '../config';
import { Role } from '@prisma/client';

type AccessClaims = {
  sub: string;
  typ: 'access';
  iat: number;
  exp: number;
  iss: string;
  aud: string;
  roles?: string[];
  tenants?: { tenantId: string; role: Role }[];
};

export function generateAccessToken(
  userId: string,
  roles?: Role[],
  tenants?: { tenantId: string; role: Role }[]
) {
  const now = Math.floor(Date.now() / 1000);
  const payload: Partial<AccessClaims> = {
    sub: userId,
    typ: 'access',
    iat: now,
    exp: now + config.jwtAccessTtlSec,
    iss: config.jwtIssuer,
    aud: config.jwtAudience,
    roles,
    tenants,
  };
  return jwt.sign(payload, config.jwtSecret, { algorithm: 'HS256' });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, config.jwtSecret, {
    algorithms: ['HS256'],
    issuer: config.jwtIssuer,
    audience: config.jwtAudience,
  });
}

export function generateRefreshTokenRaw(): string {
  return crypto.randomBytes(48).toString('hex');
}

export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export async function storeRefreshToken(
  userId: string,
  raw: string,
  ip?: string,
  userAgent?: string
) {
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(
    Date.now() + config.jwtRefreshTtlDays * 24 * 60 * 60 * 1000
  );
  return prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      ip,
      userAgent,
    },
  });
}

export async function rotateRefreshToken(
  oldHash: string,
  userId: string,
  ip?: string,
  userAgent?: string
) {
  const newRaw = generateRefreshTokenRaw();
  const newRow = await storeRefreshToken(userId, newRaw, ip, userAgent);
  await prisma.refreshToken.updateMany({
    where: { tokenHash: oldHash },
    data: { revoked: true, replacedById: newRow.id, lastUsedAt: new Date() },
  });
  return { newRaw, newRow };
}

export async function revokeAllForUser(userId: string) {
  await prisma.refreshToken.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  });
}
