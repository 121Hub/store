import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import { rateLimitMiddleware } from './middleware/rateLimit.middleware';
import config from './config';

const app = express();
app.set('trust proxy', true); // Trust first proxy
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Basic rate limits
//app.use('/auth', rateLimitMiddleware);

app.use('/auth', authRoutes);

app.get('/', (req: Request, res: Response) => res.json({ ok: true }));

export default app;
