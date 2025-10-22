import dotenv from 'dotenv';

dotenv.config();

export default {
  port: process.env.PORT ? parseInt(process.env.PORT) : 4000,
  jwtSecret: process.env.JWT_SECRET,
  jwtAccessExp: process.env.JWT_ACCESS_EXP || '15m',
  jwtRefreshTtlDays: process.env.JWT_REFRESH_TTL_DAYS
    ? parseInt(process.env.JWT_REFRESH_TTL_DAYS)
    : 30,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  cookie: {
    domain: process.env.COOKIE_DOMAIN || 'localhost',
    secure: process.env.NODE_ENV === 'production',
  },
  oauth: {
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    facebookClientId: process.env.FACEBOOK_CLIENT_ID,
    facebookClientSecret: process.env.FACEBOOK_CLIENT_SECRET,
  },
};
