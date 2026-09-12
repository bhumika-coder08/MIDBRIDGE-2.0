"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveJourney = getActiveJourney;
exports.createJourney = createJourney;
exports.updateJourneyStage = updateJourneyStage;
exports.updateRequirementStatus = updateRequirementStatus;
const uuid_1 = require("uuid");
const db_js_1 = require("../db/db.js");
const requirementEngine_js_1 = require("../services/requirementEngine.js");
const readinessCalculator_js_1 = require("../services/readinessCalculator.js");
const audit_js_1 = require("../middleware/audit.js");
async function getActiveJourney(req, res) {
    try {
        const userId = req.user.id;
        const journeysRes = await (0, db_js_1.query)(`SELECT * FROM journeys WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`, [userId]);
        if (journeysRes.rows.length === 0) {
            res.json({ journey: null });
            return;
        }
        const journey = journeysRes.rows[0];
        // Fetch 12 stages
        const stagesRes = await (0, db_js_1.query)(`SELECT * FROM journey_stages WHERE journey_id = $1 ORDER BY stage_number ASC`, [journey.id]);
        // Fetch requirements & user checklist status
        const reqsRes = await (0, db_js_1.query)(`SELECT ur.id as user_requirement_id, ur.status, ur.notes, ur.updated_at,
              r.id as requirement_id, r.title, r.description, r.category, r.mandatory, r.stage_number, r.source_url
       FROM user_requirements ur
       JOIN requirements r ON ur.requirement_id = r.id
       WHERE ur.journey_id = $1
       ORDER BY r.stage_number ASC, r.category ASC`, [journey.id]);
        // Fetch documents
        const docsRes = await (0, db_js_1.query)(`SELECT id, requirement_id, category, original_name, file_size, mime_type, file_hash, verification_status, issuer, expiry_date, created_at
       FROM documents
       WHERE journey_id = $1 OR user_id = $2
       ORDER BY created_at DESC`, [journey.id, userId]);
        // Recalculate readiness
        const readiness = await (0, readinessCalculator_js_1.calculateJourneyReadiness)(journey.id);
        res.json({
            journey: {
                ...journey,
                readiness_score: readiness.overallScore,
            },
            stages: stagesRes.rows,
            requirements: reqsRes.rows,
            documents: docsRes.rows,
            readiness,
        });
    }
    catch (err) {
        console.error('Error fetching active journey:', err);
        res.status(500).json({ error: 'Failed to retrieve active cross-border journey.' });
    }
}
async function createJourney(req, res) {
    try {
        const userId = req.user.id;
        const { fromCountry, toCountry, purpose, notes } = req.body;
        if (!fromCountry || !toCountry || !purpose) {
            res.status(400).json({ error: 'Please specify origin country, destination country, and purpose.' });
            return;
        }
        // Resolve country code if full name was sent
        const destRes = await (0, db_js_1.query)(`SELECT code, name FROM countries WHERE LOWER(name) = LOWER($1) OR LOWER(code) = LOWER($1)`, [toCountry]);
        const destCode = destRes.rows.length > 0 ? destRes.rows[0].code : toCountry.toUpperCase().slice(0, 2);
        const destName = destRes.rows.length > 0 ? destRes.rows[0].name : toCountry;
        const journeyId = (0, uuid_1.v4)();
        await (0, db_js_1.query)(`INSERT INTO journeys (id, user_id, from_country, to_country, purpose, current_stage_number, current_stage_name, readiness_score, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [journeyId, userId, fromCountry, destName, purpose, 1, 'Researching', 10, notes || null]);
        // Generate 12 standardized stages
        const stageNames = [
            { num: 1, name: 'Researching', desc: 'Exploring target destinations, academic programs, and visa requirements.' },
            { num: 2, name: 'Preparing', desc: 'Validating passport validity, translation requirements, and standardized testing.' },
            { num: 3, name: 'Applying', desc: 'Submitting applications to universities or employers; academic evaluation (APS/ZAB).' },
            { num: 4, name: 'Admitted/Approved', desc: 'Receiving official letter of admission or binding employment contract.' },
            { num: 5, name: 'Documentation', desc: 'Gathering certified academic transcripts, biometric IDs, and official forms.' },
            { num: 6, name: 'Verification', desc: 'Document integrity hashing, AI analysis, and consular/authority verification.' },
            { num: 7, name: 'Visa/Immigration', desc: 'Booking consular biometric appointment, national visa forms, and processing.' },
            { num: 8, name: 'Medical', desc: 'Statutory health insurance coverage confirmation and medical screenings.' },
            { num: 9, name: 'Financial preparation', desc: 'Funding Sperrkonto blocked account or institutional sponsorship guarantees.' },
            { num: 10, name: 'Travel', desc: 'Flight logistics, customs declarations, and document carriage checklists.' },
            { num: 11, name: 'Arrival', desc: 'Municipal registration (Anmeldung/City registration), tax ID, and local banking.' },
            { num: 12, name: 'Settling in', desc: 'University matriculation or workplace onboarding, and residence permit issuance.' },
        ];
        for (const s of stageNames) {
            const stageId = (0, uuid_1.v4)();
            await (0, db_js_1.query)(`INSERT INTO journey_stages (id, journey_id, stage_number, stage_name, description, status)
         VALUES ($1, $2, $3, $4, $5, $6)`, [stageId, journeyId, s.num, s.name, s.desc, s.num === 1 ? 'IN_PROGRESS' : 'NOT_STARTED']);
        }
        // Populate customized requirements
        await (0, requirementEngine_js_1.generateJourneyRequirements)(journeyId, destCode, purpose, fromCountry);
        // Initial readiness score
        const readiness = await (0, readinessCalculator_js_1.calculateJourneyReadiness)(journeyId);
        // Also update user profile with current destination & purpose
        await (0, db_js_1.query)(`UPDATE profiles SET current_country = $1, destination_country = $2, purpose = $3, updated_at = CURRENT_TIMESTAMP WHERE user_id = $4`, [fromCountry, destName, purpose, userId]);
        await (0, audit_js_1.logAuditEvent)({
            userId,
            action: 'JOURNEY_CREATED',
            actorRole: req.user.role,
            resourceType: 'journeys',
            resourceId: journeyId,
            metadata: { fromCountry, toCountry: destName, purpose },
            ipAddress: req.ip,
        });
        res.status(201).json({
            message: `MidBridge 2.0 journey created: ${fromCountry} → ${destName} (${purpose})`,
            journeyId,
            readiness,
        });
    }
    catch (err) {
        console.error('Error creating journey:', err);
        res.status(500).json({ error: 'Failed to initialize cross-border journey.' });
    }
}
async function updateJourneyStage(req, res) {
    try {
        const { journeyId, stageNumber } = req.params;
        const { status } = req.body; // 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'NEEDS_ATTENTION'
        await (0, db_js_1.query)(`UPDATE journey_stages SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE journey_id = $2 AND stage_number = $3`, [status, journeyId, parseInt(stageNumber, 10)]);
        // If marked completed, advance the journey's current stage
        if (status === 'COMPLETED') {
            const nextNum = Math.min(12, parseInt(stageNumber, 10) + 1);
            const nextStageRes = await (0, db_js_1.query)(`SELECT stage_name FROM journey_stages WHERE journey_id = $1 AND stage_number = $2`, [journeyId, nextNum]);
            const nextName = nextStageRes.rows[0]?.stage_name || 'Completed';
            await (0, db_js_1.query)(`UPDATE journeys SET current_stage_number = $1, current_stage_name = $2 WHERE id = $3`, [nextNum, nextName, journeyId]);
        }
        const readiness = await (0, readinessCalculator_js_1.calculateJourneyReadiness)(journeyId);
        res.json({ message: 'Journey stage updated.', readiness });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update journey stage.' });
    }
}
async function updateRequirementStatus(req, res) {
    try {
        const { userRequirementId } = req.params;
        const { status, notes } = req.body;
        const urRes = await (0, db_js_1.query)(`SELECT journey_id FROM user_requirements WHERE id = $1`, [userRequirementId]);
        if (urRes.rows.length === 0) {
            res.status(404).json({ error: 'Requirement not found.' });
            return;
        }
        const journeyId = urRes.rows[0].journey_id;
        await (0, db_js_1.query)(`UPDATE user_requirements SET status = COALESCE($1, status), notes = COALESCE($2, notes), updated_at = CURRENT_TIMESTAMP WHERE id = $3`, [status, notes, userRequirementId]);
        const readiness = await (0, readinessCalculator_js_1.calculateJourneyReadiness)(journeyId);
        res.json({ message: 'Requirement checklist item updated.', readiness });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update requirement status.' });
    }
}
