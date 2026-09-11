import { Pool } from 'pg';
import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();
let pgPool = null;
let pgliteInstance = null;
let activeEngine = 'pglite';
export async function initDatabase() {
    const databaseUrl = process.env.DATABASE_URL;
    // Try PostgreSQL connection if DATABASE_URL is configured
    if (databaseUrl && !databaseUrl.includes('placeholder')) {
        try {
            const testPool = new Pool({
                connectionString: databaseUrl,
                connectionTimeoutMillis: 2500,
            });
            const client = await testPool.connect();
            await client.query('SELECT 1');
            client.release();
            pgPool = testPool;
            activeEngine = 'pg';
            console.log('✓ Connected to external PostgreSQL database via DATABASE_URL');
            return;
        }
        catch (err) {
            console.warn(`! PostgreSQL connection via DATABASE_URL failed: ${err.message}. Falling back to embedded PostgreSQL (PGlite).`);
        }
    }
    // Fallback to embedded persistent PostgreSQL engine (PGlite)
    const dataDir = path.resolve(process.cwd(), 'data', 'pglite');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    pgliteInstance = new PGlite(dataDir);
    activeEngine = 'pglite';
    console.log(`✓ Initialized embedded PostgreSQL (PGlite) with persistence at ${dataDir}`);
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
