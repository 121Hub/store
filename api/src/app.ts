import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import { rateLimitMiddleware } from './middleware/rateLimit.middleware';

const app = express();
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Basic rate limits
app.use('/auth', rateLimitMiddleware);

app.use('/auth', authRoutes);

app.get('/', (req: Request, res: Response) => res.json({ ok: true }));

export default app;
