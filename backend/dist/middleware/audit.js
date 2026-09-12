"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAuditEvent = logAuditEvent;
const uuid_1 = require("uuid");
const db_js_1 = require("../db/db.js");
async function logAuditEvent(params) {
    try {
        const id = (0, uuid_1.v4)();
        await (0, db_js_1.query)(`INSERT INTO audit_logs (id, user_id, action, actor_role, resource_type, resource_id, metadata_json, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
            id,
            params.userId || null,
            params.action,
            params.actorRole || 'SYSTEM',
            params.resourceType,
            params.resourceId || null,
            params.metadata ? JSON.stringify(params.metadata) : null,
            params.ipAddress || null,
        ]);
    }
    catch (err) {
        console.error('Failed to log audit event:', err.message);
    }
}
