import fs from 'fs';
import path from 'path';
import { initDatabase, query } from './db.js';

export async function runMigrations(): Promise<void> {
  await initDatabase();
  
  const candidates = [
    path.resolve(__dirname, 'schema.sql'),
    path.resolve(__dirname, '..', '..', 'src', 'db', 'schema.sql'),
    path.resolve(process.cwd(), 'src', 'db', 'schema.sql'),
    path.resolve(process.cwd(), 'dist', 'db', 'schema.sql'),
    path.resolve(process.cwd(), 'backend', 'src', 'db', 'schema.sql'),
    path.resolve(process.cwd(), 'backend', 'dist', 'db', 'schema.sql'),
  ];

  let sql = '';
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      sql = fs.readFileSync(candidate, 'utf8');
      break;
    }
  }

  if (!sql) {
    throw new Error('Unable to locate schema.sql in candidate paths.');
  }

  // Split and run SQL statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      await query(statement);
    } catch (err: any) {
      // Ignore if table/index already exists
      if (!err.message?.includes('already exists')) {
        console.error('Migration statement error:', err.message);
      }
    }
  }

  console.log('✓ Database migrations executed successfully.');
}

if (process.argv[1] && process.argv[1].includes('migrate')) {
  runMigrations().then(() => process.exit(0)).catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}
