"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = initDatabase;
exports.query = query;
exports.getActiveEngine = getActiveEngine;
const pg_1 = require("pg");
const pglite_1 = require("@electric-sql/pglite");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const backendRootDir = path_1.default.resolve(__dirname, '..', '..');
let pgPool = null;
let pgliteInstance = null;
let activeEngine = 'pglite';
let initPromise = null;
async function initDatabase() {
    if (pgPool || pgliteInstance) {
        return;
    }
    if (initPromise) {
        return initPromise;
    }
    initPromise = (async () => {
        const databaseUrl = process.env.DATABASE_URL;
        // Try PostgreSQL connection if DATABASE_URL is configured
        if (databaseUrl && !databaseUrl.includes('placeholder')) {
            try {
                const isLocalhost = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');
                const testPool = new pg_1.Pool({
                    connectionString: databaseUrl,
                    connectionTimeoutMillis: 5000,
                    ssl: isLocalhost ? false : { rejectUnauthorized: false },
                });
                const client = await testPool.connect();
                await client.query('SELECT 1');
                client.release();
                pgPool = testPool;
                activeEngine = 'pg';
                console.log('✓ Connected to external PostgreSQL database via DATABASE_URL');
            }
            catch (err) {
                console.warn(`! PostgreSQL connection via DATABASE_URL failed: ${err.message}. Falling back to embedded PostgreSQL (PGlite).`);
            }
        }
        if (!pgPool) {
            // Fallback to embedded persistent PostgreSQL engine (PGlite)
            // In serverless environments (e.g. Vercel), only /tmp is writable
            const isServerless = Boolean(process.env.VERCEL ||
                process.env.VERCEL_ENV ||
                process.env.AWS_LAMBDA_FUNCTION_NAME ||
                process.env.NOW_REGION);
            const dataDir = isServerless
                ? path_1.default.resolve('/tmp', 'midbridge', 'pglite')
                : path_1.default.resolve(backendRootDir, 'data', 'pglite');
            try {
                if (!fs_1.default.existsSync(dataDir)) {
                    fs_1.default.mkdirSync(dataDir, { recursive: true });
                }
            }
            catch (err) {
                // Continue to in-memory fallback if directory creation fails
            }
            try {
                const instance = new pglite_1.PGlite(dataDir);
                await instance.waitReady;
                pgliteInstance = instance;
                activeEngine = 'pglite';
                console.log(`✓ Initialized embedded PostgreSQL (PGlite) at ${dataDir}`);
            }
            catch (err) {
                console.warn(`! Persistent PGlite initialization error: ${err.message}. Initializing in-memory fallback.`);
                const memInstance = new pglite_1.PGlite();
                await memInstance.waitReady;
                pgliteInstance = memInstance;
                activeEngine = 'pglite';
            }
        }
        // Ensure database tables and basic seed data exist on startup
        try {
            let hasTables = false;
            if (activeEngine === 'pg' && pgPool) {
                const check = await pgPool.query("SELECT 1 FROM information_schema.tables WHERE table_name = 'countries' LIMIT 1");
                hasTables = (check.rows && check.rows.length > 0);
            }
            else if (pgliteInstance) {
                try {
                    const test = await pgliteInstance.query("SELECT 1 FROM countries LIMIT 1");
                    hasTables = Boolean(test);
                }
                catch {
                    hasTables = false;
                }
            }
            if (!hasTables) {
                console.log('Database schema uninitialized. Running auto-bootstrap migrations and seed...');
                const { seedDatabase } = require('./seed.js');
                await seedDatabase();
            }
        }
        catch (bootstrapErr) {
            console.warn('Database auto-bootstrap notice:', bootstrapErr);
        }
    })();
    try {
        await initPromise;
    }
    catch (err) {
        initPromise = null;
        throw err;
    }
}
async function query(sql, params = []) {
    if (activeEngine === 'pg' && pgPool) {
        const res = await pgPool.query(sql, params);
        return {
            rows: res.rows,
            rowCount: res.rowCount ?? res.rows.length,
        };
    }
    if (!pgliteInstance) {
        await initDatabase();
    }
    if (pgliteInstance) {
        // PGlite supports pg-style parameterized queries ($1, $2, etc.)
        const res = await pgliteInstance.query(sql, params);
        return {
            rows: (res.rows || []),
            rowCount: res.affectedRows ?? res.rows?.length ?? 0,
        };
    }
    throw new Error('No database engine initialized.');
}
function getActiveEngine() {
    return activeEngine;
}
