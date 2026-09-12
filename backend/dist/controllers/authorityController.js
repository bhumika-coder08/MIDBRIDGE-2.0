"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthorityStats = getAuthorityStats;
const db_js_1 = require("../db/db.js");
async function getAuthorityStats(_req, res) {
    try {
        const pendingRes = await (0, db_js_1.query)(`SELECT COUNT(*) as count FROM documents WHERE verification_status = 'VERIFICATION_PENDING'`);
        const verifiedRes = await (0, db_js_1.query)(`SELECT COUNT(*) as count FROM documents WHERE verification_status = 'VERIFIED'`);
        const rejectedRes = await (0, db_js_1.query)(`SELECT COUNT(*) as count FROM documents WHERE verification_status = 'REJECTED'`);
        const totalRes = await (0, db_js_1.query)(`SELECT COUNT(*) as count FROM documents`);
        res.json({
            pending: parseInt(pendingRes.rows[0].count, 10),
            verified: parseInt(verifiedRes.rows[0].count, 10),
            rejected: parseInt(rejectedRes.rows[0].count, 10),
            totalUploaded: parseInt(totalRes.rows[0].count, 10),
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to retrieve authority stats.' });
    }
}
