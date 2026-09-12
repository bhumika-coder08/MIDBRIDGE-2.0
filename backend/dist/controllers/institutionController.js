import { query } from '../db/db.js';
export async function getReceivedApplications(_req, res) {
    try {
        // Return share packages directed to institutions/admissions or all packages for university role review
        const result = await query(`SELECT sp.*, u.email as applicant_email, p.full_name as applicant_name, p.nationality, p.destination_country, p.intended_course,
              COUNT(spd.document_id) as document_count
       FROM share_packages sp
       JOIN users u ON sp.user_id = u.id
       LEFT JOIN profiles p ON u.id = p.user_id
       LEFT JOIN share_package_documents spd ON sp.id = spd.share_package_id
       WHERE sp.is_revoked = false
       GROUP BY sp.id, u.email, p.full_name, p.nationality, p.destination_country, p.intended_course
       ORDER BY sp.created_at DESC`);
        res.json({ packages: result.rows });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to retrieve institution applications.' });
    }
}
