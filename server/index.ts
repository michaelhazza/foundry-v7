/**
 * Main Express server entry point.
 * Per Constitution Section D: Replit deployment requirements.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { errorHandler } from './middleware/error-handler';
import { sendSuccess } from './lib/response';

// Import route modules
import authRoutes from './routes/auth.routes';
import organisationsRoutes from './routes/organisations.routes';
import projectsRoutes from './routes/projects.routes';
import sourcesRoutes from './routes/sources.routes';
import configurationRoutes from './routes/configuration.routes';
import processingRoutes from './routes/processing.routes';
import exportsRoutes from './routes/exports.routes';
import auditRoutes from './routes/audit.routes';

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.APP_URL
    : ['http://localhost:5000', 'http://localhost:3001'],
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint - per API Contract
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/organisations', organisationsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/sources', sourcesRoutes);
app.use('/api/configuration', configurationRoutes);
app.use('/api/processing', processingRoutes);
app.use('/api/exports', exportsRoutes);
app.use('/api/audit', auditRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(process.cwd(), 'dist', 'public');
  app.use(express.static(staticPath));

  // SPA fallback - serve index.html for all non-API routes
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
const shutdown = () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
