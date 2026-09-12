import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Support both monorepo root execution and direct backend execution
const backendServerPath = fs.existsSync(path.join(__dirname, 'backend', 'dist', 'server.js'))
  ? './backend/dist/server.js'
  : './dist/server.js';

const mod = await import(backendServerPath);
const app = mod.default || mod.app || mod;

export { app };
export default app;
