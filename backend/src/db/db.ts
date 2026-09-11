import { Pool } from 'pg';
import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRootDir = path.resolve(__dirname, '..', '..');

export interface QueryResult<T = any> {
  rows: T[];
  rowCount?: number;
}

let pgPool: Pool | null = null;
let pgliteInstance: PGlite | null = null;
let activeEngine: 'pg' | 'pglite' = 'pglite';
let initPromise: Promise<void> | null = null;

export async function initDatabase(): Promise<void> {
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
        console.log('✓ Connected to external PostgreSQL database via DATABASE_URL');
        return;
      } catch (err: any) {
        console.warn(`! PostgreSQL connection via DATABASE_URL failed: ${err.message}. Falling back to embedded PostgreSQL (PGlite).`);
      }
    }

    // Fallback to embedded persistent PostgreSQL engine (PGlite)
    // In serverless environments (e.g. Vercel), only /tmp is writable
    const isServerless = process.env.VERCEL === '1' || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
    const dataDir = isServerless
      ? path.resolve('/tmp', 'midbridge', 'pglite')
      : path.resolve(backendRootDir, 'data', 'pglite');

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    try {
      const instance = new PGlite(dataDir);
      await instance.waitReady;
      pgliteInstance = instance;
      activeEngine = 'pglite';
      console.log(`✓ Initialized embedded PostgreSQL (PGlite) at ${dataDir}`);
    } catch (err: any) {
      console.warn(`! Persistent PGlite initialization error: ${err.message}. Initializing in-memory fallback.`);
      const memInstance = new PGlite();
      await memInstance.waitReady;
      pgliteInstance = memInstance;
      activeEngine = 'pglite';
    }
  })();

  try {
    await initPromise;
  } catch (err) {
    initPromise = null;
    throw err;
  }
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
  if (activeEngine === 'pg' && pgPool) {
    const res = await pgPool.query(sql, params);
    return {
      rows: res.rows as T[],
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
      rows: (res.rows || []) as T[],
      rowCount: res.affectedRows ?? res.rows?.length ?? 0,
    };
  }

  throw new Error('No database engine initialized.');
}

export function getActiveEngine(): string {
  return activeEngine;
}
