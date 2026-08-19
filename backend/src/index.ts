import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth.routes';
import fileRoutes from './routes/files.routes';
import folderRoutes from './routes/folders.routes';
import sharingRoutes from './routes/sharing.routes';
import userRoutes from './routes/users.routes';
import vaultRoutes from './routes/vault.routes';

const app = express();

// ─── Security Middleware ────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-vault-unlock-token', 'x-vault-token'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.' },
});
app.use('/api/', limiter);

// ─── Body Parsing ───────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Health Check ───────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    version: '1.0.0',
  });
});

// ─── API Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api', sharingRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/users', userRoutes);

// ─── 404 Handler ────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// ─── Error Handler ──────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || env.PORT);
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║          🔒 VaultX API Server               ║
  ║──────────────────────────────────────────────║
  ║  Status:      ✅ Running                     ║
  ║  Port:        ${PORT}                           ║
  ║  Environment: ${env.NODE_ENV.padEnd(25)}║
  ║  Storage:     ${env.STORAGE_MODE.padEnd(25)}║
  ║  Health:      http://localhost:${PORT}/health   ║
  ╚══════════════════════════════════════════════╝
  `);
});

export default app;
