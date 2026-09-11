import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/db.js';
export async function getAdminMetrics(_req, res) {
    try {
        const usersCount = await query(`SELECT COUNT(*) as count FROM users`);
        const journeysCount = await query(`SELECT COUNT(*) as count FROM journeys`);
        const docsCount = await query(`SELECT COUNT(*) as count FROM documents`);
        const verifCount = await query(`SELECT COUNT(*) as count FROM document_verifications`);
        const avgReadiness = await query(`SELECT ROUND(AVG(readiness_score)) as avg FROM journeys`);
        const roleDist = await query(`SELECT role, COUNT(*) as count FROM users GROUP BY role`);
        const recentAudit = await query(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 20`);
        res.json({
            metrics: {
                totalUsers: parseInt(usersCount.rows[0].count, 10),
                totalJourneys: parseInt(journeysCount.rows[0].count, 10),
                totalDocuments: parseInt(docsCount.rows[0].count, 10),
                totalVerifications: parseInt(verifCount.rows[0].count, 10),
                averageReadiness: parseInt(avgReadiness.rows[0].avg || '0', 10),
                roles: roleDist.rows,
            },
            recentAuditLogs: recentAudit.rows,
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to load administrative analytics.' });
    }
}
export async function getAllUsers(_req, res) {
    try {
        const result = await query(`SELECT u.id, u.email, u.role, u.created_at, p.full_name, p.nationality, p.destination_country, p.purpose
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       ORDER BY u.created_at DESC`);
        res.json({ users: result.rows });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to load users.' });
    }
}
export async function addCountryRequirement(req, res) {
    try {
        const { destination, purpose, category, title, description, mandatory, stageNumber, sourceUrl } = req.body;
        if (!destination || !purpose || !category || !title) {
            res.status(400).json({ error: 'Missing mandatory requirement metadata.' });
            return;
        }
        const id = `req-${destination.toLowerCase()}-${purpose.toLowerCase()}-${uuidv4().slice(0, 6)}`;
        await query(`INSERT INTO requirements (id, nationality, destination, purpose, category, title, description, mandatory, stage_number, source_url, last_updated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE)`, [id, null, destination.toUpperCase(), purpose, category, title, description || '', mandatory !== false, stageNumber || 5, sourceUrl || null]);
        res.status(201).json({ message: 'Requirement policy added to registry.', requirementId: id });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to add requirement.' });
    }
}
