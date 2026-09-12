import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcSchema = path.join(__dirname, 'src', 'db', 'schema.sql');
const distDbDir = path.join(__dirname, 'dist', 'db');
const distSchema = path.join(distDbDir, 'schema.sql');

if (fs.existsSync(srcSchema)) {
  fs.mkdirSync(distDbDir, { recursive: true });
  fs.copyFileSync(srcSchema, distSchema);
  console.log('✓ Copied schema.sql to dist/db/schema.sql');
}
