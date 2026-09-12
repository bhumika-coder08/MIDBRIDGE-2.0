"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCostPlan = getCostPlan;
exports.addCostItem = addCostItem;
exports.updateCostItem = updateCostItem;
exports.deleteCostItem = deleteCostItem;
exports.addFundingSource = addFundingSource;
exports.updateFundingSource = updateFundingSource;
exports.deleteFundingSource = deleteFundingSource;
exports.updateExchangeRate = updateExchangeRate;
const uuid_1 = require("uuid");
const db_js_1 = require("../db/db.js");
const audit_js_1 = require("../middleware/audit.js");
function getDestinationBaselineEstimates(destCountry, purpose, curr) {
    const isEUR = curr === 'EUR' || curr.includes('EUR');
    const isUSD = curr === 'USD' || curr.includes('USD');
    const isGBP = curr === 'GBP' || curr.includes('GBP');
    const c = isEUR ? 'EUR' : isUSD ? 'USD' : isGBP ? 'GBP' : 'EUR';
    return [
        {
            name: 'National Consular Visa Fee',
            category: 'IMMIGRATION',
            timing: 'PRE_DEPARTURE',
            amount: isEUR ? 75 : isUSD ? 185 : 490,
            currency: c,
            isMandatory: true,
            source: 'Consular Fee Schedule',
            notes: 'Standard application processing fee for long-term visa.',
        },
        {
            name: 'Biometric & Document Legalization / APS',
            category: 'DOCUMENTATION',
            timing: 'PRE_DEPARTURE',
            amount: isEUR ? 190 : isUSD ? 220 : 150,
            currency: c,
            isMandatory: true,
            source: 'Academic Verification Office',
            notes: 'Credential evaluation and translation certification.',
        },
        {
            name: purpose === 'Study' ? 'Proof of Financial Resources (Blocked Account / Solvency)' : 'Relocation Financial Reserve',
            category: 'FINANCIAL_REQUIREMENTS',
            timing: 'PRE_DEPARTURE',
            amount: isEUR ? 11904 : isUSD ? 15000 : 12000,
            currency: c,
            isMandatory: true,
            source: 'Federal Ministry Guidelines (2026/2027)',
            notes: 'Statutory living cost proof required for visa issuance.',
        },
        {
            name: 'Statutory Health & Travel Medical Insurance',
            category: 'HEALTH',
            timing: 'MONTHLY_RECURRING',
            amount: isEUR ? 125 : isUSD ? 160 : 80,
            currency: c,
            isMandatory: true,
            source: 'Statutory Health Fund',
            notes: 'Monthly coverage starting on entry date.',
        },
        {
            name: 'International Airfare & Baggage Allowance',
            category: 'TRAVEL',
            timing: 'PRE_DEPARTURE',
            amount: isEUR ? 550 : isUSD ? 750 : 500,
            currency: c,
            isMandatory: false,
            source: 'Commercial Aviation Baseline',
            notes: 'One-way economy international travel ticket.',
        },
        {
            name: 'Temporary Accommodation & Security Deposit',
            category: 'ACCOMMODATION',
            timing: 'FIRST_MONTH',
            amount: isEUR ? 850 : isUSD ? 1200 : 950,
            currency: c,
            isMandatory: true,
            source: 'Student Union Housing Averages',
            notes: 'First month accommodation deposit and rent.',
        },
        {
            name: 'Local Transit Card & Connectivity (SIM/eSIM)',
            category: 'ARRIVAL',
            timing: 'FIRST_MONTH',
            amount: isEUR ? 85 : isUSD ? 100 : 70,
            currency: c,
            isMandatory: false,
            source: 'Municipal Transport Authority',
            notes: 'Initial connectivity and public transit pass.',
        },
        {
            name: 'Unforeseen Contingency & Emergency Reserve',
            category: 'EMERGENCY',
            timing: 'PRE_DEPARTURE',
            amount: isEUR ? 500 : isUSD ? 600 : 500,
            currency: c,
            isMandatory: false,
            source: 'Recommended Safe Practice',
            notes: 'Liquid emergency funds for flight delays or urgent setup.',
        },
    ];
}
async function getCostPlan(req, res) {
    try {
        const userId = req.user.id;
        // Get active journey
        const journeyRes = await (0, db_js_1.query)(`SELECT * FROM journeys WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`, [userId]);
        const journey = journeyRes.rows[0] || null;
        // Retrieve or create cost plan
        let planRes = await (0, db_js_1.query)(`SELECT * FROM cost_plans WHERE user_id = $1`, [userId]);
        let plan = planRes.rows[0] || null;
        if (!plan) {
            const destCurr = journey?.to_country === 'United States' ? 'USD'
                : journey?.to_country === 'United Kingdom' ? 'GBP'
                    : journey?.to_country === 'Japan' ? 'JPY'
                        : journey?.to_country === 'Canada' ? 'CAD'
                            : journey?.to_country === 'Australia' ? 'AUD'
                                : 'EUR';
            // Default rate: 1 INR = 0.011 EUR, or 1 INR = 0.012 USD
            const initialRate = destCurr === 'USD' ? 0.012 : destCurr === 'GBP' ? 0.0094 : destCurr === 'JPY' ? 1.75 : 0.011;
            const newPlanId = (0, uuid_1.v4)();
            await (0, db_js_1.query)(`INSERT INTO cost_plans (id, user_id, journey_id, home_currency, dest_currency, exchange_rate, exchange_rate_source)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [newPlanId, userId, journey ? journey.id : null, 'INR', destCurr, initialRate, 'Manual / Baseline Estimate']);
            // Seed baseline items
            const baselineEstimates = getDestinationBaselineEstimates(journey ? journey.to_country : 'Germany', journey ? journey.purpose : 'Study', destCurr);
            for (const item of baselineEstimates) {
                await (0, db_js_1.query)(`INSERT INTO cost_items (id, plan_id, name, category, timing, estimated_amount, currency, is_mandatory, source, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`, [(0, uuid_1.v4)(), newPlanId, item.name, item.category, item.timing, item.amount, item.currency, item.isMandatory, item.source, item.notes]);
            }
            planRes = await (0, db_js_1.query)(`SELECT * FROM cost_plans WHERE id = $1`, [newPlanId]);
            plan = planRes.rows[0];
        }
        // Retrieve items & funding sources
        const itemsRes = await (0, db_js_1.query)(`SELECT * FROM cost_items WHERE plan_id = $1 ORDER BY category, timing`, [plan.id]);
        const items = itemsRes.rows;
        const fundingRes = await (0, db_js_1.query)(`SELECT * FROM funding_sources WHERE plan_id = $1 ORDER BY created_at DESC`, [plan.id]);
        const funding = fundingRes.rows;
        // Retrieve scholarships available for user's destination
        let matchingScholarships = [];
        if (journey) {
            const schRes = await (0, db_js_1.query)(`SELECT * FROM scholarships WHERE country_code = (SELECT code FROM countries WHERE name = $1 OR code = $1 LIMIT 1)`, [journey.to_country]);
            matchingScholarships = schRes.rows;
        }
        // Calculate Totals
        const rate = parseFloat(plan.exchange_rate) || 0.011;
        let preDepartureTotal = 0;
        let firstMonthTotal = 0;
        let monthlyRecurring = 0;
        let yearOneTotal = 0;
        for (const item of items) {
            const amt = parseFloat(item.estimated_amount) || 0;
            if (item.timing === 'PRE_DEPARTURE') {
                preDepartureTotal += amt;
            }
            else if (item.timing === 'FIRST_MONTH') {
                firstMonthTotal += amt;
            }
            else if (item.timing === 'MONTHLY_RECURRING') {
                monthlyRecurring += amt;
            }
        }
        yearOneTotal = preDepartureTotal + firstMonthTotal + (monthlyRecurring * 11);
        // Funding calculations
        let confirmedFunding = 0;
        let plannedFunding = 0;
        for (const f of funding) {
            const amt = parseFloat(f.amount) || 0;
            if (f.status === 'AWARDED_CONFIRMED') {
                confirmedFunding += amt;
            }
            else {
                plannedFunding += amt;
            }
        }
        const estimatedFundingGap = Math.max(0, yearOneTotal - confirmedFunding);
        const financialReadinessPercentage = yearOneTotal > 0
            ? Math.min(100, Math.round((confirmedFunding / yearOneTotal) * 100))
            : 50;
        res.json({
            plan: {
                id: plan.id,
                homeCurrency: plan.home_currency,
                destCurrency: plan.dest_currency,
                exchangeRate: rate,
                exchangeRateSource: plan.exchange_rate_source,
                lastRateUpdate: plan.last_rate_update,
            },
            summary: {
                preDepartureTotal: Math.round(preDepartureTotal),
                firstMonthTotal: Math.round(firstMonthTotal),
                monthlyRecurring: Math.round(monthlyRecurring),
                yearOneTotal: Math.round(yearOneTotal),
                confirmedFunding: Math.round(confirmedFunding),
                plannedFunding: Math.round(plannedFunding),
                estimatedFundingGap: Math.round(estimatedFundingGap),
                financialReadinessPercentage,
                preDepartureTotalHome: Math.round(rate > 0 ? preDepartureTotal / rate : 0),
                yearOneTotalHome: Math.round(rate > 0 ? yearOneTotal / rate : 0),
                confirmedFundingHome: Math.round(rate > 0 ? confirmedFunding / rate : 0),
                estimatedFundingGapHome: Math.round(rate > 0 ? estimatedFundingGap / rate : 0),
            },
            items,
            funding,
            matchingScholarships,
            disclaimer: 'Planning estimate — verify current official consular, university, and banking fees before making financial commitments.',
        });
    }
    catch (err) {
        console.error('Cost Planner error:', err);
        res.status(500).json({ error: 'Failed to retrieve mobility cost planner.' });
    }
}
async function addCostItem(req, res) {
    try {
        const userId = req.user.id;
        const { name, category, timing = 'PRE_DEPARTURE', estimatedAmount, currency, isMandatory = true, source, notes } = req.body;
        if (!name || !category || estimatedAmount === undefined) {
            res.status(400).json({ error: 'Please provide item name, category, and estimated amount.' });
            return;
        }
        const planRes = await (0, db_js_1.query)(`SELECT id, dest_currency FROM cost_plans WHERE user_id = $1`, [userId]);
        if (planRes.rows.length === 0) {
            res.status(404).json({ error: 'Cost plan not found for user.' });
            return;
        }
        const plan = planRes.rows[0];
        const itemId = (0, uuid_1.v4)();
        await (0, db_js_1.query)(`INSERT INTO cost_items (id, plan_id, name, category, timing, estimated_amount, currency, is_mandatory, source, user_edited, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10)`, [
            itemId,
            plan.id,
            name.trim(),
            category,
            timing,
            parseFloat(estimatedAmount) || 0,
            currency || plan.dest_currency,
            !!isMandatory,
            source || 'User Custom Expense',
            notes || null,
        ]);
        await (0, audit_js_1.logAuditEvent)({
            userId,
            action: 'COST_ITEM_ADDED',
            actorRole: req.user.role,
            resourceType: 'cost_items',
            resourceId: itemId,
            metadata: { name, amount: estimatedAmount },
            ipAddress: req.ip,
        });
        res.status(201).json({ message: 'Cost item added to mobility plan.', itemId });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to add cost item.' });
    }
}
async function updateCostItem(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { name, category, timing, estimatedAmount, currency, isMandatory, source, notes } = req.body;
        // Strict IDOR ownership check
        const checkRes = await (0, db_js_1.query)(`SELECT ci.id FROM cost_items ci
       JOIN cost_plans cp ON ci.plan_id = cp.id
       WHERE ci.id = $1 AND cp.user_id = $2`, [id, userId]);
        if (checkRes.rows.length === 0) {
            res.status(404).json({ error: 'Cost item not found or unauthorized.' });
            return;
        }
        await (0, db_js_1.query)(`UPDATE cost_items
       SET name = COALESCE($1, name),
           category = COALESCE($2, category),
           timing = COALESCE($3, timing),
           estimated_amount = COALESCE($4, estimated_amount),
           currency = COALESCE($5, currency),
           is_mandatory = COALESCE($6, is_mandatory),
           source = COALESCE($7, source),
           notes = COALESCE($8, notes),
           user_edited = true,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9`, [
            name ? name.trim() : null,
            category || null,
            timing || null,
            estimatedAmount !== undefined ? parseFloat(estimatedAmount) : null,
            currency || null,
            isMandatory !== undefined ? !!isMandatory : null,
            source || null,
            notes || null,
            id,
        ]);
        await (0, audit_js_1.logAuditEvent)({
            userId,
            action: 'COST_ITEM_UPDATED',
            actorRole: req.user.role,
            resourceType: 'cost_items',
            resourceId: id,
            ipAddress: req.ip,
        });
        res.json({ message: 'Cost item updated successfully.' });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update cost item.' });
    }
}
async function deleteCostItem(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        // Strict IDOR ownership check
        const checkRes = await (0, db_js_1.query)(`SELECT ci.id FROM cost_items ci
       JOIN cost_plans cp ON ci.plan_id = cp.id
       WHERE ci.id = $1 AND cp.user_id = $2`, [id, userId]);
        if (checkRes.rows.length === 0) {
            res.status(404).json({ error: 'Cost item not found or unauthorized.' });
            return;
        }
        await (0, db_js_1.query)(`DELETE FROM cost_items WHERE id = $1`, [id]);
        await (0, audit_js_1.logAuditEvent)({
            userId,
            action: 'COST_ITEM_DELETED',
            actorRole: req.user.role,
            resourceType: 'cost_items',
            resourceId: id,
            ipAddress: req.ip,
        });
        res.json({ message: 'Cost item deleted from plan.' });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to delete cost item.' });
    }
}
async function addFundingSource(req, res) {
    try {
        const userId = req.user.id;
        const { title, fundingType = 'PERSONAL_SAVINGS', amount, currency, status = 'PLANNED', scholarshipId, notes } = req.body;
        if (!title || amount === undefined) {
            res.status(400).json({ error: 'Please specify funding title and amount.' });
            return;
        }
        const planRes = await (0, db_js_1.query)(`SELECT id, dest_currency FROM cost_plans WHERE user_id = $1`, [userId]);
        if (planRes.rows.length === 0) {
            res.status(404).json({ error: 'Cost plan not found.' });
            return;
        }
        const plan = planRes.rows[0];
        const fundingId = (0, uuid_1.v4)();
        await (0, db_js_1.query)(`INSERT INTO funding_sources (id, plan_id, title, funding_type, status, amount, currency, scholarship_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
            fundingId,
            plan.id,
            title.trim(),
            fundingType,
            status,
            parseFloat(amount) || 0,
            currency || plan.dest_currency,
            scholarshipId || null,
            notes || null,
        ]);
        await (0, audit_js_1.logAuditEvent)({
            userId,
            action: 'FUNDING_SOURCE_ADDED',
            actorRole: req.user.role,
            resourceType: 'funding_sources',
            resourceId: fundingId,
            metadata: { title, amount, status },
            ipAddress: req.ip,
        });
        res.status(201).json({ message: 'Funding source saved to plan.', fundingId });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to add funding source.' });
    }
}
async function updateFundingSource(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { status, amount, title, notes } = req.body;
        const checkRes = await (0, db_js_1.query)(`SELECT fs.id FROM funding_sources fs
       JOIN cost_plans cp ON fs.plan_id = cp.id
       WHERE fs.id = $1 AND cp.user_id = $2`, [id, userId]);
        if (checkRes.rows.length === 0) {
            res.status(404).json({ error: 'Funding source not found or unauthorized.' });
            return;
        }
        await (0, db_js_1.query)(`UPDATE funding_sources
       SET status = COALESCE($1, status),
           amount = COALESCE($2, amount),
           title = COALESCE($3, title),
           notes = COALESCE($4, notes)
       WHERE id = $5`, [
            status || null,
            amount !== undefined ? parseFloat(amount) : null,
            title ? title.trim() : null,
            notes || null,
            id,
        ]);
        res.json({ message: 'Funding source updated.' });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update funding source.' });
    }
}
async function deleteFundingSource(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const checkRes = await (0, db_js_1.query)(`SELECT fs.id FROM funding_sources fs
       JOIN cost_plans cp ON fs.plan_id = cp.id
       WHERE fs.id = $1 AND cp.user_id = $2`, [id, userId]);
        if (checkRes.rows.length === 0) {
            res.status(404).json({ error: 'Funding source not found or unauthorized.' });
            return;
        }
        await (0, db_js_1.query)(`DELETE FROM funding_sources WHERE id = $1`, [id]);
        res.json({ message: 'Funding source removed.' });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to delete funding source.' });
    }
}
async function updateExchangeRate(req, res) {
    try {
        const userId = req.user.id;
        const { exchangeRate, source = 'User Custom Rate', homeCurrency, destCurrency } = req.body;
        if (!exchangeRate || parseFloat(exchangeRate) <= 0) {
            res.status(400).json({ error: 'Please provide a valid positive exchange rate.' });
            return;
        }
        await (0, db_js_1.query)(`UPDATE cost_plans
       SET exchange_rate = $1,
           exchange_rate_source = $2,
           home_currency = COALESCE($3, home_currency),
           dest_currency = COALESCE($4, dest_currency),
           last_rate_update = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $5`, [parseFloat(exchangeRate), source, homeCurrency || null, destCurrency || null, userId]);
        res.json({ message: 'Exchange rate adjusted successfully.' });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update exchange rate.' });
    }
}
