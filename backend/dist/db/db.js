import { Pool } from 'pg';
import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRootDir = path.resolve(__dirname, '..', '..');
let pgPool = null;
let pgliteInstance = null;
let activeEngine = 'pglite';
let initPromise = null;
export async function initDatabase() {
    if (pgPool || pgliteInstance) {
        return;
    }
    if (initPromise) {
        return initPromise;
    }
    initPromise = (async () => {
        console.log('[DB-INIT] Starting database engine initialization...');
        const databaseUrl = process.env.DATABASE_URL;
        const hasDatabaseUrl = Boolean(databaseUrl && !databaseUrl.includes('placeholder'));
        console.log(`[DB-INIT] DATABASE_URL provided: ${hasDatabaseUrl}`);
        const isServerless = Boolean(process.env.VERCEL ||
            process.env.VERCEL_ENV ||
            process.env.AWS_LAMBDA_FUNCTION_NAME ||
            process.env.NOW_REGION);
        console.log(`[DB-INIT] Serverless environment detected: ${isServerless}`);
        // 1. Connect to PostgreSQL if DATABASE_URL is configured
        if (hasDatabaseUrl) {
            try {
                console.log('[DB-INIT] Connecting to PostgreSQL pool via DATABASE_URL...');
                const isLocalhost = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');
                const testPool = new Pool({
                    connectionString: databaseUrl,
                    connectionTimeoutMillis: 5000,
                    ssl: isLocalhost ? false : { rejectUnauthorized: false },
                });
                const client = await testPool.connect();
                await client.query('SELECT 1');
                client.release();
                pgPool = testPool;
                activeEngine = 'pg';
                console.log('✓ [DB-INIT] Successfully connected to PostgreSQL database');
            }
            catch (err) {
                console.error(`! [DB-INIT] PostgreSQL connection failed: ${err.message}. Falling back to embedded PostgreSQL.`);
            }
        }
        // 2. Embedded PostgreSQL engine (PGlite) fallback
        if (!pgPool) {
            try {
                if (isServerless) {
                    // In serverless, use in-memory PGlite directly to prevent filesystem lock aborts
                    console.log('[DB-INIT] Initializing in-memory PGlite engine for serverless execution...');
                    const memInstance = new PGlite();
                    await memInstance.waitReady;
                    pgliteInstance = memInstance;
                    activeEngine = 'pglite';
                    console.log('✓ [DB-INIT] In-memory PGlite ready');
                }
                else {
                    // In local standalone dev, use persistent data folder
                    const dataDir = path.resolve(backendRootDir, 'data', 'pglite');
                    try {
                        if (!fs.existsSync(dataDir)) {
                            fs.mkdirSync(dataDir, { recursive: true });
                        }
                    }
                    catch { }
                    try {
                        const instance = new PGlite(dataDir);
                        await instance.waitReady;
                        pgliteInstance = instance;
                        activeEngine = 'pglite';
                        console.log(`✓ [DB-INIT] Initialized persistent PGlite at ${dataDir}`);
                    }
                    catch (persistErr) {
                        console.warn(`! [DB-INIT] Persistent PGlite warning: ${persistErr.message}, initializing in-memory`);
                        const memInstance = new PGlite();
                        await memInstance.waitReady;
                        pgliteInstance = memInstance;
                        activeEngine = 'pglite';
                    }
                }
            }
            catch (pgliteErr) {
                console.error('[DB-INIT-ERROR] PGlite failed to initialize:', pgliteErr.message);
                throw new Error(`Database engine could not be initialized: ${pgliteErr.message}`);
            }
        }
        // 3. Ensure database schema and seed data exist
        try {
            console.log('[DB-INIT] Verifying schema and tables...');
            let hasTables = false;
            if (activeEngine === 'pg' && pgPool) {
                const check = await pgPool.query("SELECT 1 FROM information_schema.tables WHERE table_name = 'countries' LIMIT 1");
                hasTables = Boolean(check.rows && check.rows.length > 0);
            }
            else if (pgliteInstance) {
                try {
                    const test = await pgliteInstance.query("SELECT 1 FROM countries LIMIT 1");
                    hasTables = Boolean(test && test.rows && test.rows.length > 0);
                }
                catch {
                    hasTables = false;
                }
            }
            if (!hasTables) {
                console.log('[DB-INIT] Required tables missing. Running automatic migrations and seed...');
                const { seedDatabase } = await import('./seed.js');
                await seedDatabase();
                console.log('✓ [DB-INIT] Database schema and initial data auto-bootstrapped successfully.');
            }
            else {
                console.log('✓ [DB-INIT] Database schema verified.');
            }
        }
        catch (bootstrapErr) {
            console.error('[DB-INIT-ERROR] Auto-bootstrap error:', bootstrapErr.message);
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
export async function query(sql, params = []) {
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
export function getActiveEngine() {
    return activeEngine;
}
