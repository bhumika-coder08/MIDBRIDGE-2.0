"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminMetrics = getAdminMetrics;
exports.getAllUsers = getAllUsers;
exports.addCountryRequirement = addCountryRequirement;
const uuid_1 = require("uuid");
const db_js_1 = require("../db/db.js");
async function getAdminMetrics(_req, res) {
    try {
        const usersCount = await (0, db_js_1.query)(`SELECT COUNT(*) as count FROM users`);
        const journeysCount = await (0, db_js_1.query)(`SELECT COUNT(*) as count FROM journeys`);
        const docsCount = await (0, db_js_1.query)(`SELECT COUNT(*) as count FROM documents`);
        const verifCount = await (0, db_js_1.query)(`SELECT COUNT(*) as count FROM document_verifications`);
        const avgReadiness = await (0, db_js_1.query)(`SELECT ROUND(AVG(readiness_score)) as avg FROM journeys`);
        const roleDist = await (0, db_js_1.query)(`SELECT role, COUNT(*) as count FROM users GROUP BY role`);
        const recentAudit = await (0, db_js_1.query)(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 20`);
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
async function getAllUsers(_req, res) {
    try {
        const result = await (0, db_js_1.query)(`SELECT u.id, u.email, u.role, u.created_at, p.full_name, p.nationality, p.destination_country, p.purpose
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       ORDER BY u.created_at DESC`);
        res.json({ users: result.rows });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to load users.' });
    }
}
async function addCountryRequirement(req, res) {
    try {
        const { destination, purpose, category, title, description, mandatory, stageNumber, sourceUrl } = req.body;
        if (!destination || !purpose || !category || !title) {
            res.status(400).json({ error: 'Missing mandatory requirement metadata.' });
            return;
        }
        const id = `req-${destination.toLowerCase()}-${purpose.toLowerCase()}-${(0, uuid_1.v4)().slice(0, 6)}`;
        await (0, db_js_1.query)(`INSERT INTO requirements (id, nationality, destination, purpose, category, title, description, mandatory, stage_number, source_url, last_updated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE)`, [id, null, destination.toUpperCase(), purpose, category, title, description || '', mandatory !== false, stageNumber || 5, sourceUrl || null]);
        res.status(201).json({ message: 'Requirement policy added to registry.', requirementId: id });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to add requirement.' });
    }
}
