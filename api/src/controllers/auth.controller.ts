import { Request, Response } from 'express';
import { prisma } from '../prismaClient';
import argon2 from 'argon2';
import crypto from 'crypto';
import config from '../config';
import slugify from 'slugify';
import { Role } from '@prisma/client';
import * as EmailService from '../services/email.service';
import * as TokenService from '../services/token.service';
import * as OAuthService from '../services/oauth.service';
import { generateUniqueTenantSlug } from '../utils/slugify';

// Controller functions
// ------------------------------------------------------------------
// Signup, Confirm Email, Login, Refresh Token, Logout,
// Forgot Password, Reset Password, OAuth Redirect, OAuth Callback
// ------------------------------------------------------------------

// Signup
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

  const base =
    tenantSlug ||
    (name
      ? slugify(name, { lower: true, strict: true })
      : slugify(email.split('@')[0], { lower: true, strict: true }));
  const uniqueSlug = await generateUniqueTenantSlug(base);

  const tenant = await prisma.tenant.create({
    data: { name: name || email, slug: uniqueSlug },
  });
  await prisma.userTenant.create({
    data: { userId: user.id, tenantId: tenant.id, role: Role.TENANT_ADMIN },
  });
  await prisma.roleAssignment.create({
    data: { userId: user.id, role: Role.TENANT_ADMIN, scope: tenant.id },
  });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = TokenService.hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
  await prisma.emailToken.create({
    data: { userId: user.id, tokenHash, type: 'EMAIL_CONFIRM', expiresAt },
  });

  const confirmUrl = `${config.frontendUrl}/confirm-email?token=${rawToken}&uid=${user.id}`;
  await EmailService.sendEmailConfirmation(user.email, confirmUrl);

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      event: 'signup',
      meta: { tenantSlug: uniqueSlug },
    },
  });

  return res.status(201).json({
    message: 'Signup ok, check your email to confirm.',
    tenantSlug: uniqueSlug,
  });
}

// Confirm Email
export async function confirmEmail(req: Request, res: Response) {
  const { token, uid } = req.query as any;
  if (!token || !uid) return res.status(400).send('Missing');
  const tokenHash = TokenService.hashToken(token);
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

  const isAjax = req.xhr || req.headers.accept?.includes('application/json');
  if (isAjax)
    return res.json({ ok: true, message: 'Email confirmed successfully' });

  return res.redirect(`${config.frontendUrl}/confirmed`);
}

// Login
export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'email and password required' });

  const user = await prisma.user.findUnique({
    where: { email },
    include: { tenants: true, roleAssignments: true },
  });
  if (!user || !user.passwordHash)
    return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await argon2.verify(user.passwordHash, password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  if (!user.emailVerified)
    return res.status(403).json({ error: 'Email not verified' });

  const tenants = user.tenants.map((t) => ({
    tenantId: t.tenantId,
    role: t.role,
  }));
  const platformRoles = user.roleAssignments
    .filter((r) => r.scope === 'platform')
    .map((r) => r.role);

  const accessToken = TokenService.generateAccessToken(
    user.id,
    platformRoles,
    tenants
  );
  const rawRefresh = TokenService.generateRefreshTokenRaw();

  await TokenService.storeRefreshToken(
    user.id,
    rawRefresh,
    req.ip || undefined,
    req.get('User-Agent') || undefined
  );

  // Set access_token cookie (short-lived)
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: 'lax',
    domain: config.cookie.domain,
    maxAge: config.jwtAccessTtlSec * 1000,
  });

  // Set refresh_token cookie (long-lived)
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

  return res.json({ ok: true });
}

// Refresh
export async function refresh(req: Request, res: Response) {
  const raw = req.cookies['refresh_token'];
  if (!raw) return res.status(401).json({ error: 'No refresh token' });
  const tokenHash = TokenService.hashToken(raw);
  const tokenRow = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  });
  if (!tokenRow) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (tokenRow.revoked || tokenRow.expiresAt < new Date()) {
    return res.status(401).json({ error: 'Expired or revoked' });
  }

  const user = await prisma.user.findUnique({
    where: { id: tokenRow.userId },
    include: { tenants: true, roleAssignments: true },
  });

  if (!user) return res.status(401).json({ error: 'Invalid user' });

  const { newRaw } = await TokenService.rotateRefreshToken(
    tokenHash,
    tokenRow.userId,
    req.ip || undefined,
    req.get('User-Agent') || undefined
  );

  const tenants = user.tenants.map((t) => ({
    tenantId: t.tenantId,
    role: t.role,
  }));
  const platformRoles = user.roleAssignments
    .filter((r) => r.scope === 'platform')
    .map((r) => r.role);

  const accessToken = TokenService.generateAccessToken(
    user.id,
    platformRoles,
    tenants
  );

  // Set new access_token cookie
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: 'lax',
    domain: config.cookie.domain,
    maxAge: config.jwtAccessTtlSec * 1000,
  });

  // Set new refresh_token cookie
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
  return res.json({ ok: true });
}

// Logout
export async function logout(req: Request, res: Response) {
  const raw = req.cookies['refresh_token'] || req.body.refreshToken;
  if (!raw) {
    res.clearCookie('refresh_token', { domain: config.cookie.domain });
    return res.json({ ok: true });
  }
  const tokenHash = TokenService.hashToken(raw);
  const tokenRow = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  });
  if (tokenRow)
    await prisma.refreshToken.update({
      where: { id: tokenRow.id },
      data: { revoked: true },
    });

  res.clearCookie('access_token', { domain: config.cookie.domain });
  res.clearCookie('refresh_token', { domain: config.cookie.domain });

  return res.json({ ok: true });
}

// Forgot Password
export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.json({ ok: true });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = TokenService.hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
  await prisma.emailToken.create({
    data: { userId: user.id, tokenHash, type: 'PASSWORD_RESET', expiresAt },
  });
  const resetUrl = `${config.frontendUrl}/reset-password?token=${rawToken}&uid=${user.id}`;
  await EmailService.sendPasswordReset(user.email, resetUrl);
  await prisma.auditLog.create({
    data: { userId: user.id, event: 'forgot_password' },
  });
  return res.json({ ok: true });
}

// Reset Password
export async function resetPassword(req: Request, res: Response) {
  const { token, uid, newPassword } = req.body;
  if (!token || !uid || !newPassword)
    return res.status(400).json({ error: 'invalid' });
  const tokenHash = TokenService.hashToken(token);
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

// OAuth Redirect
export async function oauthRedirect(req: Request, res: Response) {
  const provider = req.params.provider;
  const url = OAuthService.getAuthorizationUrl(
    provider,
    `${config.frontendUrl}/callback`
  );
  if (!url) return res.status(400).send('Unknown provider');
  return res.redirect(url);
}

// OAuth Callback
export async function oauthCallback(req: Request, res: Response) {
  try {
    const provider = req.params.provider;
    const result = await OAuthService.handleCallback(
      provider,
      req.query as any
    );
    const userId = result?.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tenants: true },
    });
    if (user && user.tenants.length === 0) {
      const base = slugify(user.name || user.email.split('@')[0], {
        lower: true,
        strict: true,
      });
      let unique = base;
      let i = 1;
      while (await prisma.tenant.findUnique({ where: { slug: unique } }))
        unique = `${base}-${i++}`;
      const tenant = await prisma.tenant.create({
        data: { name: user.name || user.email, slug: unique },
      });
      await prisma.userTenant.create({
        data: { userId: user.id, tenantId: tenant.id, role: Role.TENANT_ADMIN },
      });
      await prisma.roleAssignment.create({
        data: { userId: user.id, role: Role.TENANT_ADMIN, scope: tenant.id },
      });
    }

    const full = await prisma.user.findUnique({
      where: { id: userId },
      include: { tenants: true, roleAssignments: true },
    });

    const tenants =
      full?.tenants.map((t) => ({ tenantId: t.tenantId, role: t.role })) || [];
    const platformRoles =
      full?.roleAssignments
        .filter((r) => r.scope === 'platform')
        .map((r) => r.role) || [];

    const accessToken = TokenService.generateAccessToken(
      userId!,
      platformRoles,
      tenants
    );

    const rawRefresh = TokenService.generateRefreshTokenRaw();
    await TokenService.storeRefreshToken(
      userId!,
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
      `${config.frontendUrl}/oauth-success?accessToken=${accessToken}`
    );
  } catch (err) {
    console.error(err);
    return res.redirect(`${config.frontendUrl}/oauth-error`);
  }
}

// Me
export async function me(req: Request, res: Response) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub },
    include: { tenants: true, roleAssignments: true },
  });
  if (!dbUser) return res.status(404).json({ error: 'Not found' });
  const tenants = dbUser.tenants.map((t) => ({
    tenantId: t.tenantId,
    role: t.role,
  }));
  const platformRoles = dbUser.roleAssignments
    .filter((r) => r.scope === 'platform')
    .map((r) => r.role);

  return res.json({
    id: dbUser.id,
    email: dbUser.email,
    tenants,
    platformRoles,
  });
}
