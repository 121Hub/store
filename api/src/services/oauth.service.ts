import axios from 'axios';
import config from '../config';
import { prisma } from '../prismaClient';

export function getAuthorizationUrl(provider: string, redirectUri: string) {
  if (provider === 'google') {
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', config.oauth.googleClientId || '');
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('prompt', 'select_account');
    url.searchParams.set('access_type', 'offline');
    return url.toString();
  }
  return null;
}

export async function handleCallback(provider: string, query: any) {
  if (provider === 'google') {
    const code = query.code;
    if (!code) throw new Error('No code');
    const tokenResp = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code,
        client_id: config.oauth.googleClientId || '',
        client_secret: config.oauth.googleClientSecret || '',
        redirect_uri: `${config.frontendUrl}/auth/callback`,
        grant_type: 'authorization_code',
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const idToken = tokenResp.data.id_token;
    const parts = idToken.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    const email = payload.email;
    const sub = payload.sub;
    if (!email) throw new Error('No email');

    let oauth = await prisma.oAuthAccount.findFirst({
      where: { provider: 'google', providerId: sub },
    });
    if (!oauth) {
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: { email, emailVerified: true, name: payload.name },
        });
      }
      oauth = await prisma.oAuthAccount.create({
        data: {
          provider: 'google',
          providerId: sub,
          providerEmail: email,
          userId: user.id,
        },
      });
      return { user, created: true };
    }
    const user = await prisma.user.findUnique({ where: { id: oauth.userId } });
    return { user, created: false };
  }
  throw new Error('Unknown provider');
}
