import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/environment';
import routes from './routes';
import { apiLimiter, errorHandler, notFoundHandler } from './middleware';
import { httpLogStream } from './utils/logger';

export function createApp(): Express {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Trust proxy (for rate limiting behind reverse proxy)
  app.set('trust proxy', 1);

  // Request logging
  if (env.NODE_ENV !== 'test') {
    app.use(morgan('combined', { stream: httpLogStream }));
  }

  // Body parsing
  // Note: Stripe webhook needs raw body, so we handle it specially
  app.use((req, res, next) => {
    if (req.originalUrl === '/api/webhooks/stripe') {
      // Capture raw body for Stripe webhook
      let data = '';
      req.setEncoding('utf8');
      req.on('data', (chunk) => {
        data += chunk;
      });
      req.on('end', () => {
        (req as express.Request & { rawBody: Buffer }).rawBody = Buffer.from(data);
        next();
      });
    } else {
      express.json({ limit: '10mb' })(req, res, next);
    }
  });

  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Rate limiting
  app.use('/api', apiLimiter);

  // API routes
  app.use('/api', routes);

  // Health check at root
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
}
