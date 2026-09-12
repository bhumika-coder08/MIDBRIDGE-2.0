"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_js_1 = require("./db/db.js");
const api_js_1 = require("./routes/api.js");
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const upload_js_1 = require("./middleware/upload.js");
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.SERVER_PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
// Middleware
const allowedOrigins = [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5000'];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, serverless same-origin)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        return callback(null, true); // Permissive in deployment to avoid CORS blocking across preview/prod domains
    },
    credentials: true,
}));
app.use(express_1.default.json({ limit: '20mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '20mb' }));
// Static file hosting for uploads (secured via download route, but available for image previews)
app.use('/uploads', express_1.default.static(upload_js_1.uploadDir));
// Global safety handlers to log exceptions in serverless without silent container drops
process.on('uncaughtException', (err) => {
    console.error('[FATAL-UNCAUGHT-EXCEPTION]', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason) => {
    console.error('[FATAL-UNHANDLED-REJECTION]', reason);
});
// Request logger for diagnostic tracing in Vercel logs
app.use((req, _res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.originalUrl || req.url}`);
    next();
});
// Middleware to ensure database is initialized on serverless invocation
app.use(async (req, res, next) => {
    try {
        await (0, db_js_1.initDatabase)();
        next();
    }
    catch (err) {
        console.error('[DB-INIT-FAIL] Database initialization failed on request:', req.method, req.url, err && err.stack ? err.stack : err.message);
        res.status(500).json({
            error: 'Database initialization failed.',
            message: err && err.message ? err.message : 'Unknown database error',
            engine: (0, db_js_1.getActiveEngine)()
        });
    }
});
// Health check handler
const healthHandler = (_req, res) => {
    res.json({
        status: 'ok',
        service: 'MidBridge 2.0 Mobility Infrastructure API',
        databaseEngine: (0, db_js_1.getActiveEngine)(),
        timestamp: new Date().toISOString(),
    });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);
app.get('/', healthHandler);
// Mount Main API Router on both /api (standard path) and / (if stripped by reverse proxy / rewrite)
app.use('/api', api_js_1.apiRouter);
app.use('/', api_js_1.apiRouter);
// Centralized error handling
app.use(errorHandler_js_1.errorHandler);
// Start server for local development
const isServerless = Boolean(process.env.VERCEL ||
    process.env.VERCEL_ENV ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NOW_REGION);
// Only listen if executed directly from CLI and not in serverless runtime
const isDirectRun = !isServerless &&
    ((typeof require !== 'undefined' && require.main === module) ||
        Boolean(process.argv[1] && (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js'))));
if (isDirectRun) {
    async function startServer() {
        try {
            await (0, db_js_1.initDatabase)();
            app.listen(PORT, () => {
                console.log(`====================================================`);
                console.log(`  MidBridge 2.0 API Server active on http://localhost:${PORT}`);
                console.log(`  Database Engine: ${(0, db_js_1.getActiveEngine)().toUpperCase()}`);
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
}
exports.default = app;
// Ensure CommonJS module.exports compatibility for AWS Lambda / Vercel Serverless Function bridges
if (typeof module !== 'undefined' && module.exports) {
    module.exports = app;
    module.exports.default = app;
    module.exports.app = app;
}
