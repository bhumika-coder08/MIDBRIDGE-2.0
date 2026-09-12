import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { initDatabase, getActiveEngine } from './db/db.js';
import { apiRouter } from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';
import { uploadDir } from './middleware/upload.js';

dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middleware
const allowedOrigins = [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5000'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, serverless same-origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in deployment to avoid CORS blocking across preview/prod domains
  },
  credentials: true,
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static file hosting for uploads (secured via download route, but available for image previews)
app.use('/uploads', express.static(uploadDir));

// Middleware to ensure database is initialized on serverless invocation
app.use(async (_req, _res, next) => {
  try {
    await initDatabase();
    next();
  } catch (err) {
    console.error('Database initialization middleware error:', err);
    next(err);
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'MidBridge 2.0 Mobility Infrastructure API',
    databaseEngine: getActiveEngine(),
    timestamp: new Date().toISOString(),
  });
});

// Mount Main API Router
app.use('/api', apiRouter);

// Centralized error handling
app.use(errorHandler);

// Start server for local development
const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.VERCEL_ENV ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NOW_REGION
);

// Only listen if executed directly from CLI and not in serverless runtime
const isDirectRun =
  !isServerless &&
  ((typeof require !== 'undefined' && require.main === module) ||
    Boolean(process.argv[1] && (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js'))));

if (isDirectRun) {
  async function startServer() {
    try {
      await initDatabase();
      app.listen(PORT, () => {
        console.log(`====================================================`);
        console.log(`  MidBridge 2.0 API Server active on http://localhost:${PORT}`);
        console.log(`  Database Engine: ${getActiveEngine().toUpperCase()}`);
        console.log(`  Allowed Client: ${CLIENT_URL}`);
        console.log(`====================================================`);
      });
    } catch (err: any) {
      console.error('Fatal Server Boot Error:', err);
      process.exit(1);
    }
  }

  startServer();
}

export { app };
export default app;

// Ensure CommonJS module.exports compatibility for AWS Lambda / Vercel Serverless Function bridges
if (typeof module !== 'undefined' && module.exports) {
  module.exports = app;
  module.exports.default = app;
  module.exports.app = app;
}
