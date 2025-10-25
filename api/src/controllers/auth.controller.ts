import { Request, Response } from 'express';
import { prisma } from '../prismaClient';
import argon2 from 'argon2';
import crypto from 'crypto';
import config from '../config';
import * as EmailService from '../services/email.service';
import * as TokenService from '../services/token.service';
import * as OAuthService from '../services/oauth.service';

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

interface ConfirmEmailQuery {
  token?: string;
  uid?: string;
}
export async function confirmEmail(req: Request, res: Response) {
  const { token, uid } = req.query as unknown as ConfirmEmailQuery;
  if (!token || !uid) return res.status(400).send('Missing');
  const tokenHash = hashToken(token);
  const etok = await prisma.emailToken.findUnique({ where: { tokenHash } });
  if (!etok || etok.userId !== uid)
    return res.status(400).send('Invalid token');
  if (etok.expiresAt < new Date()) return res.status(400).send('Expired');

  await prisma.user.update({
    where: { id: uid },
    data: { emailVerified: true },
  });
  await prisma.emailToken.delete({ where: { id: etok.id } });
  await prisma.auditLog.create({
    data: { userId: uid, event: 'email_confirm' },
  });

  return res.redirect(`${config.frontendUrl}/auth/confirmed`);
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'email and password required' });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash)
    return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await argon2.verify(user.passwordHash, password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  if (!user.emailVerified)
    return res.status(403).json({ error: 'Email not verified' });

  const accessToken = TokenService.generateAccessToken(user.id);
  const rawRefresh = TokenService.generateRefreshTokenRaw();
  await TokenService.storeRefreshToken(
    user.id,
    rawRefresh,
    req.ip || undefined,
    req.get('User-Agent') || undefined
  );

  res.cookie('refresh_token', rawRefresh, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: 'lax',
    domain: config.cookie.domain,
    maxAge: config.jwtRefreshTtlDays * 24 * 60 * 60 * 1000,
  });

  await prisma.auditLog.create({
    data: { userId: user.id, event: 'login', meta: { ip: req.ip } },
  });

  return res.json({ accessToken });
}

export async function refresh(req: Request, res: Response) {
  const raw = req.cookies['refresh_token'] || req.body.refreshToken;
  if (!raw) return res.status(401).json({ error: 'No refresh token' });
  const tokenHash = hashToken(raw);
  const tokenRow = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  });
  if (!tokenRow) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (tokenRow.revoked || tokenRow.expiresAt < new Date()) {
    return res.status(401).json({ error: 'Expired or revoked' });
  }

  const newRaw = TokenService.generateRefreshTokenRaw();
  const newToken = await TokenService.storeRefreshToken(
    tokenRow.userId,
    newRaw,
    req.ip || undefined,
    req.get('User-Agent') || undefined
  );

  await prisma.refreshToken.update({
    where: { id: tokenRow.id },
    data: { revoked: true, replacedById: newToken.id, lastUsedAt: new Date() },
  });

  const accessToken = TokenService.generateAccessToken(tokenRow.userId);

  res.cookie('refresh_token', newRaw, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: 'lax',
    domain: config.cookie.domain,
    maxAge: config.jwtRefreshTtlDays * 24 * 60 * 60 * 1000,
  });

  await prisma.auditLog.create({
    data: { userId: tokenRow.userId, event: 'refresh' },
  });
  return res.json({ accessToken });
}

export async function logout(req: Request, res: Response) {
  const raw = req.cookies['refresh_token'] || req.body.refreshToken;
  if (!raw) {
    res.clearCookie('refresh_token', { domain: config.cookie.domain });
    return res.json({ ok: true });
  }
  const tokenHash = hashToken(raw);
  const tokenRow = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  });
  if (tokenRow)
    await prisma.refreshToken.update({
      where: { id: tokenRow.id },
      data: { revoked: true },
    });

  res.clearCookie('refresh_token', { domain: config.cookie.domain });
  return res.json({ ok: true });
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.json({ ok: true });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
  await prisma.emailToken.create({
    data: { userId: user.id, tokenHash, type: 'PASSWORD_RESET', expiresAt },
  });
  const resetUrl = `${config.frontendUrl}/auth/reset-password?token=${rawToken}&uid=${user.id}`;
  await EmailService.sendPasswordReset(user.email, resetUrl);
  await prisma.auditLog.create({
    data: { userId: user.id, event: 'forgot_password' },
  });
  return res.json({ ok: true });
}

export async function resetPassword(req: Request, res: Response) {
  const { token, uid, newPassword } = req.body;
  if (!token || !uid || !newPassword)
    return res.status(400).json({ error: 'invalid' });
  const tokenHash = hashToken(token);
  const etok = await prisma.emailToken.findUnique({ where: { tokenHash } });
  if (!etok || etok.userId !== uid)
    return res.status(400).json({ error: 'Invalid token' });
  if (etok.expiresAt < new Date())
    return res.status(400).json({ error: 'Expired' });

  const passwordHash = await argon2.hash(newPassword);
  await prisma.user.update({ where: { id: uid }, data: { passwordHash } });
  await prisma.emailToken.delete({ where: { id: etok.id } });
  await prisma.auditLog.create({
    data: { userId: uid, event: 'reset_password' },
  });

  return res.json({ ok: true });
}

export async function oauthRedirect(req: Request, res: Response) {
  const provider = req.params.provider;
  const url = OAuthService.getAuthorizationUrl(
    provider,
    `${config.frontendUrl}/auth/callback`
  );
  if (!url) return res.status(400).send('Unknown provider');
  return res.redirect(url);
}

interface OAuthCallbackQuery {
  code?: string;
  state?: string;
  [key: string]: string | undefined;
}

export async function oauthCallback(req: Request, res: Response) {
  try {
    const provider = req.params.provider;
    const result = await OAuthService.handleCallback(
      provider,
      req.query as unknown as OAuthCallbackQuery
    );
    const user = result.user;
    const accessToken = TokenService.generateAccessToken(user?.id!);
    const rawRefresh = TokenService.generateRefreshTokenRaw();
    await TokenService.storeRefreshToken(
      user?.id!,
      rawRefresh,
      req.ip || undefined,
      req.get('User-Agent') || undefined
    );
    res.cookie('refresh_token', rawRefresh, {
      httpOnly: true,
      secure: config.cookie.secure,
      sameSite: 'lax',
      domain: config.cookie.domain,
      maxAge: config.jwtRefreshTtlDays * 24 * 60 * 60 * 1000,
    });

    return res.redirect(
      `${config.frontendUrl}/auth/oauth-success?accessToken=${accessToken}`
    );
  } catch (err) {
    console.error(err);
    return res.redirect(`${config.frontendUrl}/auth/oauth-error`);
  }
}
