"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateJourneyReadiness = calculateJourneyReadiness;
const db_js_1 = require("../db/db.js");
async function calculateJourneyReadiness(journeyId) {
    // 1. Fetch journey details
    const journeyRes = await (0, db_js_1.query)(`SELECT * FROM journeys WHERE id = $1`, [journeyId]);
    if (journeyRes.rows.length === 0) {
        throw new Error('Journey not found');
    }
    const journey = journeyRes.rows[0];
    const userId = journey.user_id;
    // 2. Fetch user requirements
    const userReqsResult = await (0, db_js_1.query)(`SELECT ur.*, r.category, r.title, r.mandatory, r.stage_number
     FROM user_requirements ur
     JOIN requirements r ON ur.requirement_id = r.id
     WHERE ur.journey_id = $1`, [journeyId]);
    // 3. Fetch documents in vault
    const docsResult = await (0, db_js_1.query)(`SELECT * FROM documents WHERE user_id = $1`, [userId]);
    // 4. Fetch health documents
    const healthResult = await (0, db_js_1.query)(`SELECT * FROM health_documents WHERE user_id = $1`, [userId]);
    // 5. Fetch cost plan & funding
    const planResult = await (0, db_js_1.query)(`SELECT * FROM cost_plans WHERE user_id = $1`, [userId]);
    // 6. Fetch journey stages
    const stagesResult = await (0, db_js_1.query)(`SELECT * FROM journey_stages WHERE journey_id = $1 ORDER BY stage_number ASC`, [journeyId]);
    const reqs = userReqsResult.rows;
    const docs = docsResult.rows;
    const healthDocs = healthResult.rows;
    const stages = stagesResult.rows;
    const plan = planResult.rows[0] || null;
    const penalties = [];
    // ==========================================
    // 1. Document Readiness (Weight 25%)
    // ==========================================
    let mandatoryTotal = 0;
    let mandatoryUploaded = 0;
    let missingTitles = [];
    reqs.forEach(r => {
        if (r.mandatory) {
            mandatoryTotal++;
            if (['UPLOADED', 'AI_ANALYZED', 'VERIFIED', 'VERIFICATION_PENDING'].includes(r.status)) {
                mandatoryUploaded++;
            }
            else {
                missingTitles.push(r.title);
            }
        }
    });
    const docScore = mandatoryTotal > 0 ? Math.round((mandatoryUploaded / mandatoryTotal) * 100) : (docs.length > 0 ? 100 : 0);
    if (missingTitles.length > 0) {
        penalties.push(`${missingTitles.length} mandatory document${missingTitles.length > 1 ? 's' : ''} missing: ${missingTitles.slice(0, 2).join(', ')}${missingTitles.length > 2 ? '...' : ''}`);
    }
    // ==========================================
    // 2. Health Readiness (Weight 20%)
    // ==========================================
    const standardHealthKeys = ['HEALTH_INSURANCE', 'VACCINATION', 'MEDICAL_FITNESS'];
    const satisfiedHealthKeys = standardHealthKeys.filter(cat => healthDocs.some(hd => hd.category === cat && (!hd.expiry_date || new Date(hd.expiry_date) > new Date())));
    const healthScore = Math.round((satisfiedHealthKeys.length / standardHealthKeys.length) * 100);
    if (!satisfiedHealthKeys.includes('HEALTH_INSURANCE')) {
        penalties.push('Mandatory health insurance certificate missing from Health Vault.');
    }
    if (!satisfiedHealthKeys.includes('VACCINATION')) {
        penalties.push('Vaccination record missing or expired in Health Vault.');
    }
    // ==========================================
    // 3. Financial Readiness (Weight 20%)
    // ==========================================
    let financialScore = 40;
    if (plan) {
        const itemsRes = await (0, db_js_1.query)(`SELECT estimated_amount, timing FROM cost_items WHERE plan_id = $1`, [plan.id]);
        let totalTarget = 0;
        for (const it of itemsRes.rows) {
            const amt = parseFloat(it.estimated_amount) || 0;
            if (it.timing === 'PRE_DEPARTURE' || it.timing === 'FIRST_MONTH') {
                totalTarget += amt;
            }
        }
        const fundRes = await (0, db_js_1.query)(`SELECT amount FROM funding_sources WHERE plan_id = $1 AND status = 'AWARDED_CONFIRMED'`, [plan.id]);
        let confirmed = 0;
        for (const f of fundRes.rows) {
            confirmed += parseFloat(f.amount) || 0;
        }
        financialScore = totalTarget > 0 ? Math.min(100, Math.round((confirmed / totalTarget) * 100)) : 60;
    }
    if (financialScore < 70) {
        penalties.push('Financial solvency proof incomplete or planned funding unconfirmed.');
    }
    // ==========================================
    // 4. Visa & Consular Readiness (Weight 15%)
    // ==========================================
    const visaStage = stages.find(s => s.stage_name.toLowerCase().includes('visa') || s.stage_number === 7);
    let visaScore = 25;
    if (visaStage) {
        visaScore = visaStage.status === 'COMPLETED' ? 100 : visaStage.status === 'IN_PROGRESS' ? 60 : 25;
    }
    else if (journey.current_stage_number >= 7) {
        visaScore = 65;
    }
    if (visaScore < 100) {
        penalties.push('Visa & immigration stage pending consular submission or appointment.');
    }
    // ==========================================
    // 5. Travel Preparation Readiness (Weight 10%)
    // ==========================================
    const travelStage = stages.find(s => s.stage_name.toLowerCase().includes('travel') || s.stage_number === 10);
    const travelScore = travelStage ? (travelStage.status === 'COMPLETED' ? 100 : travelStage.status === 'IN_PROGRESS' ? 65 : 20) : (journey.current_stage_number >= 10 ? 80 : 30);
    if (travelScore < 60) {
        penalties.push('Pre-departure travel prep and customs packing checklist not started.');
    }
    // ==========================================
    // 6. Arrival & Settlement Readiness (Weight 10%)
    // ==========================================
    const arrivalStage = stages.find(s => s.stage_name.toLowerCase().includes('arrival') || s.stage_number === 11);
    const arrivalScore = arrivalStage ? (arrivalStage.status === 'COMPLETED' ? 100 : arrivalStage.status === 'IN_PROGRESS' ? 60 : 15) : (journey.current_stage_number >= 11 ? 85 : 20);
    // ==========================================
    // Overall Weighted Score
    // ==========================================
    const overall = Math.min(100, Math.round(docScore * 0.25 +
        healthScore * 0.20 +
        financialScore * 0.20 +
        visaScore * 0.15 +
        travelScore * 0.10 +
        arrivalScore * 0.10));
    // Next action logic
    let nextAction = 'Explore target requirements and begin document assembly';
    if (docScore < 100 && missingTitles.length > 0) {
        nextAction = `Upload mandatory document: '${missingTitles[0]}' in Document Vault`;
    }
    else if (healthScore < 100) {
        nextAction = 'Secure and upload mandatory statutory health insurance in Health Vault';
    }
    else if (financialScore < 70) {
        nextAction = 'Record confirmed scholarship, blocked account deposit, or sponsor guarantee in Cost Planner';
    }
    else if (visaScore < 80) {
        nextAction = 'Schedule consular biometric appointment and assemble visa dossier';
    }
    else if (travelScore < 80) {
        nextAction = 'Review transit customs restrictions and finalize luggage checklist';
    }
    else {
        nextAction = 'All core readiness criteria satisfied. Ready for international departure.';
    }
    // Persist updated score
    await (0, db_js_1.query)(`UPDATE journeys SET readiness_score = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [overall, journeyId]);
    return {
        overallScore: overall,
        categories: {
            documents: docScore,
            health: healthScore,
            financial: financialScore,
            visa: visaScore,
            travel: travelScore,
            arrival: arrivalScore,
        },
        breakdown: [
            { category: 'Document Vault', score: docScore, weight: 25, details: `${mandatoryUploaded}/${mandatoryTotal} mandatory documents uploaded` },
            { category: 'Health Vault', score: healthScore, weight: 20, details: `${satisfiedHealthKeys.length}/${standardHealthKeys.length} health requirements satisfied` },
            { category: 'Financial Solvency', score: financialScore, weight: 20, details: `${financialScore}% of target pre-departure & first-month funds confirmed` },
            { category: 'Visa & Immigration', score: visaScore, weight: 15, details: `Consular stage: ${visaStage ? visaStage.status : 'In Preparation'}` },
            { category: 'Travel Prep', score: travelScore, weight: 10, details: `Pre-departure transit tasks: ${travelScore}% complete` },
            { category: 'Arrival Protocol', score: arrivalScore, weight: 10, details: `Post-landing municipal registration: ${arrivalScore}% complete` },
        ],
        penalties: penalties.slice(0, 5),
        nextRecommendedAction: nextAction,
    };
}
