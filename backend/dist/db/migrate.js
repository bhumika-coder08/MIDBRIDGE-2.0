"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db_js_1 = require("./db.js");
const schemaSql_js_1 = require("./schemaSql.js");
async function runMigrations() {
    await (0, db_js_1.initDatabase)();
    let sql = schemaSql_js_1.schemaSql;
    if (!sql) {
        const candidates = [
            path_1.default.resolve(__dirname, 'schema.sql'),
            path_1.default.resolve(__dirname, '..', '..', 'src', 'db', 'schema.sql'),
            path_1.default.resolve(process.cwd(), 'src', 'db', 'schema.sql'),
            path_1.default.resolve(process.cwd(), 'dist', 'db', 'schema.sql'),
            path_1.default.resolve(process.cwd(), 'backend', 'src', 'db', 'schema.sql'),
            path_1.default.resolve(process.cwd(), 'backend', 'dist', 'db', 'schema.sql'),
        ];
        for (const candidate of candidates) {
            if (fs_1.default.existsSync(candidate)) {
                sql = fs_1.default.readFileSync(candidate, 'utf8');
                break;
            }
        }
    }
    // Split and run SQL statements
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    for (const statement of statements) {
        try {
            await (0, db_js_1.query)(statement);
        }
        catch (err) {
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
