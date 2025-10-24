import { Request, Response } from 'express';
import { prisma } from '../prismaClient';
import argon2 from 'argon2';
import crypto from 'crypto';
import config from '../config';
import * as EmailService from '../services/email.service';

function hashToken(raw: string) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export async function signup(req: Request, res: Response) {
  const { email, password, name, tenantSlug } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'email and password required' });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: 'Email already exists' });

  const passwordHash = await argon2.hash(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });

  if (tenantSlug) {
    const tenant = await prisma.tenant.create({
      data: { name: tenantSlug, slug: tenantSlug },
    });
    await prisma.userTenant.create({
      data: { userId: user.id, tenantId: tenant.id, role: 'TENANT_ADMIN' },
    });
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
  await prisma.emailToken.create({
    data: { userId: user.id, tokenHash, type: 'EMAIL_CONFIRM', expiresAt },
  });

  const confirmUrl = `${config.frontendUrl}/auth/confirm-email?token=${rawToken}&uid=${user.id}`;
  await EmailService.sendEmailConfirmation(user.email, confirmUrl);

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      event: 'signup',
      meta: { tenantSlug: tenantSlug || null },
    },
  });

  return res
    .status(201)
    .json({ message: 'Signup ok, check your email to confirm.' });
}
