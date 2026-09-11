import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDatabase, getActiveEngine } from './db/db.js';
import { apiRouter } from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.SERVER_PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
// Middleware
app.use(cors({
    origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
// Static file hosting for uploads (secured via download route, but available for image previews)
const uploadDir = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadDir));
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
// Start server
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
    }
    catch (err) {
        console.error('Fatal Server Boot Error:', err);
        process.exit(1);
    }
}
startServer();
