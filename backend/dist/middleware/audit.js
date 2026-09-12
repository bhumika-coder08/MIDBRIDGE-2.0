import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/db.js';
export async function logAuditEvent(params) {
    try {
        const id = uuidv4();
        await query(`INSERT INTO audit_logs (id, user_id, action, actor_role, resource_type, resource_id, metadata_json, ip_address)
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
