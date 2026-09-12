"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCountries = getAllCountries;
exports.getCountryByCode = getCountryByCode;
const db_js_1 = require("../db/db.js");
async function getAllCountries(_req, res) {
    console.log('[COUNTRIES] Retrieving country library records...');
    try {
        const result = await (0, db_js_1.query)(`SELECT code, name, region, flag_emoji, cover_image, popular_purposes, summary, processing_time_weeks, currency, language
       FROM countries
       ORDER BY name ASC`);
        const countries = result.rows.map(c => ({
            ...c,
            popular_purposes: typeof c.popular_purposes === 'string' ? JSON.parse(c.popular_purposes) : c.popular_purposes,
        }));
        console.log(`✓ [COUNTRIES] Successfully loaded ${countries.length} destination countries`);
        res.json({ countries });
    }
    catch (err) {
        console.error('[COUNTRIES-ERROR] Failed to query countries:', err && err.stack ? err.stack : err);
        res.status(500).json({
            error: 'Failed to retrieve country library.',
            details: err && err.message ? err.message : 'Database query error',
        });
    }
}
async function getCountryByCode(req, res) {
    try {
        const { code } = req.params;
        const countryRes = await (0, db_js_1.query)(`SELECT * FROM countries WHERE LOWER(code) = LOWER($1) OR LOWER(name) = LOWER($1)`, [code]);
        if (countryRes.rows.length === 0) {
            res.status(404).json({ error: `Country with identifier '${code}' not found in MidBridge 2.0 library.` });
            return;
        }
        const country = countryRes.rows[0];
        country.popular_purposes = typeof country.popular_purposes === 'string' ? JSON.parse(country.popular_purposes) : country.popular_purposes;
        // Fetch structured content sections
        const contentRes = await (0, db_js_1.query)(`SELECT category, title, content, source_organization, source_url, last_checked
       FROM country_content
       WHERE LOWER(country_code) = LOWER($1)
       ORDER BY category ASC`, [country.code]);
        // Fetch associated scholarships
        const schRes = await (0, db_js_1.query)(`SELECT * FROM scholarships WHERE LOWER(country_code) = LOWER($1) ORDER BY deadline ASC`, [country.code]);
        res.json({
            country,
            sections: contentRes.rows,
            scholarships: schRes.rows,
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to retrieve detailed country intelligence.' });
    }
}
