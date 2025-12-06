// IMPORTANT: Load .env FIRST before any other imports!
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (one level up from server/)
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

// Debug: Show if .env was loaded
console.log('📄 Loading .env from:', envPath);
console.log('🔑 JWT_SECRET configured:', !!process.env.JWT_SECRET);
console.log('🔑 SESSION_SECRET configured:', !!process.env.SESSION_SECRET);
console.log('🔑 PATREON_CLIENT_ID configured:', !!process.env.PATREON_CLIENT_ID);
console.log('🔑 PATREON_CLIENT_SECRET configured:', !!process.env.PATREON_CLIENT_SECRET);

// NOW import everything else (after .env is loaded)
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import session from 'express-session';
import { initDatabase } from './database/db.js';
import passport from './config/passport.js';

// Routes
import authRoutes from './routes/auth.js';
import postsRoutes from './routes/posts.js';
import commentsRoutes from './routes/comments.js';
import uploadRoutes from './routes/upload.js';
import categoriesRoutes from './routes/categories.js';
import notificationsRoutes from './routes/notifications.js';
import tagsRoutes from './routes/tags.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initDatabase();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/tags', tagsRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
interface ErrorWithStatus extends Error {
  status?: number;
}

app.use((err: ErrorWithStatus, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ⭐ StarsTranslations Server                            ║
║                                                           ║
║   Server running on: http://localhost:${PORT}              ║
║   Environment: ${process.env.NODE_ENV || 'development'}                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
