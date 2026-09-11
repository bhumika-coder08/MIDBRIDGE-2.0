import { query } from '../db/db.js';
export async function getScholarships(req, res) {
    try {
        const { country, level, funding } = req.query;
        let sql = `SELECT s.*, c.name as country_name, c.flag_emoji
               FROM scholarships s
               JOIN countries c ON s.country_code = c.code
               WHERE 1=1`;
        const params = [];
        if (country) {
            params.push(country);
            sql += ` AND (LOWER(s.country_code) = LOWER($${params.length}) OR LOWER(c.name) = LOWER($${params.length}))`;
        }
        if (level) {
            params.push(`%${level}%`);
            sql += ` AND LOWER(s.level) LIKE LOWER($${params.length})`;
        }
        if (funding) {
            params.push(`%${funding}%`);
            sql += ` AND LOWER(s.funding_type) LIKE LOWER($${params.length})`;
        }
        sql += ` ORDER BY s.deadline ASC`;
        const result = await query(sql, params);
        res.json({ scholarships: result.rows });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to retrieve scholarship opportunities.' });
    }
}
