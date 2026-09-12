import { query } from '../db/db.js';
export async function assembleUserContext(userId) {
    const journeys = await query(`SELECT * FROM journeys WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`, [userId]);
    const journey = journeys.rows[0] || null;
    let requirements = [];
    let country = null;
    let scholarships = [];
    if (journey) {
        const reqsRes = await query(`SELECT ur.*, r.category, r.title, r.description, r.mandatory, r.stage_number
       FROM user_requirements ur
       JOIN requirements r ON ur.requirement_id = r.id
       WHERE ur.journey_id = $1`, [journey.id]);
        requirements = reqsRes.rows;
        const countryRes = await query(`SELECT * FROM countries WHERE name = $1 OR code = $1`, [journey.to_country]);
        country = countryRes.rows[0] || null;
        const schRes = await query(`SELECT * FROM scholarships WHERE country_code = $1 LIMIT 5`, [country ? country.code : 'DE']);
        scholarships = schRes.rows;
    }
    const docsRes = await query(`SELECT * FROM documents WHERE user_id = $1`, [userId]);
    const healthDocsRes = await query(`SELECT * FROM health_documents WHERE user_id = $1`, [userId]);
    const planRes = await query(`SELECT * FROM cost_plans WHERE user_id = $1`, [userId]);
    const costPlan = planRes.rows[0] || null;
    let costItems = [];
    let fundingSources = [];
    if (costPlan) {
        const itemsRes = await query(`SELECT * FROM cost_items WHERE plan_id = $1`, [costPlan.id]);
        costItems = itemsRes.rows;
        const fundRes = await query(`SELECT * FROM funding_sources WHERE plan_id = $1`, [costPlan.id]);
        fundingSources = fundRes.rows;
    }
    return {
        userId,
        journey,
        requirements,
        documents: docsRes.rows,
        healthDocuments: healthDocsRes.rows,
        costPlan,
        costItems,
        fundingSources,
        readinessScore: journey ? journey.readiness_score : 0,
        country,
        scholarships,
    };
}
export async function generateAssistantResponse(prompt, context) {
    const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    // External API integration if API key configured
    if (apiKey && process.env.GEMINI_API_KEY) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            role: 'user',
                            parts: [{
                                    text: `You are MidBridge 2.0 AI Assistant, an expert cross-border mobility companion.
Current User Context:
- Active Journey: ${context.journey ? `${context.journey.from_country} → ${context.journey.to_country} (${context.journey.purpose})` : 'None'}
- Readiness Score: ${context.readinessScore}%
- Total Documents Uploaded: ${context.documents?.length || 0}
- Health Documents in Vault: ${context.healthDocuments?.length || 0}
- Missing Requirements: ${context.requirements?.filter(r => r.mandatory && !['UPLOADED', 'VERIFIED'].includes(r.status)).map(r => r.title).join(', ') || 'None'}

User Question: ${prompt}

Give a structured, clear, and actionable response with markdown bullets. Do not make up non-existent government requirements.`
                                }]
                        }
                    ]
                })
            });
            const data = await response.json();
            if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                return data.candidates[0].content.parts[0].text;
            }
        }
        catch (err) {
            console.warn('External AI API call failed, falling back to built-in intelligence engine:', err);
        }
    }
    // Built-in Deterministic Contextual Intelligence Engine
    const q = prompt.toLowerCase();
    const j = context.journey;
    if (!j) {
        return `### Welcome to MidBridge 2.0 Assistant\n\nYou do not have an active journey created yet. Start by choosing your **Origin Country**, **Destination**, and **Purpose of Travel** (Study, Work, Immigration, or Research) in the **Journey Builder** so I can assemble your personalized roadmap!`;
    }
    const missingReqs = context.requirements?.filter(r => r.mandatory && !['UPLOADED', 'VERIFIED', 'AI_ANALYZED'].includes(r.status)) || [];
    const uploadedDocs = context.documents || [];
    const healthDocs = context.healthDocuments || [];
    const costItems = context.costItems || [];
    const funding = context.fundingSources || [];
    // Health vault inquiries
    if (q.includes('health') || q.includes('vaccin') || q.includes('insurance') || q.includes('medical')) {
        const hasInsurance = healthDocs.some(h => h.category === 'HEALTH_INSURANCE' || h.category === 'TRAVEL_INSURANCE');
        const hasVaccine = healthDocs.some(h => h.category === 'VACCINATION');
        const hasFitness = healthDocs.some(h => h.category === 'MEDICAL_FITNESS');
        return `### Health Vault & Medical Readiness\n\nFor your route to **${j.to_country}**:\n- **Statutory / Travel Health Insurance**: ${hasInsurance ? '✅ Uploaded in Health Vault' : '⚠️ **Missing** — Statutory coverage required prior to visa appointment'}\n- **Vaccination Records**: ${hasVaccine ? '✅ Uploaded' : '⚠️ **Missing** — Ensure routine international vaccinations are documented'}\n- **Medical Fitness Certificate**: ${hasFitness ? '✅ Uploaded' : '⚠️ **Missing** — May be required during consular medical examination'}\n\n*All health files in your **Health Vault** are private by default and only disclosed when you generate a selective health share package.*`;
    }
    // Cost & Expenses inquiries
    if (q.includes('cost') || q.includes('expense') || q.includes('budget') || q.includes('gap') || q.includes('price') || q.includes('fee')) {
        let pre = 0, first = 0, monthly = 0;
        let largestItem = null;
        for (const it of costItems) {
            const amt = parseFloat(it.estimated_amount) || 0;
            if (it.timing === 'PRE_DEPARTURE')
                pre += amt;
            else if (it.timing === 'FIRST_MONTH')
                first += amt;
            else if (it.timing === 'MONTHLY_RECURRING')
                monthly += amt;
            if (!largestItem || amt > (parseFloat(largestItem.estimated_amount) || 0)) {
                largestItem = it;
            }
        }
        const yearOne = pre + first + (monthly * 11);
        const confirmedFund = funding.filter(f => f.status === 'AWARDED_CONFIRMED').reduce((s, f) => s + (parseFloat(f.amount) || 0), 0);
        const gap = Math.max(0, yearOne - confirmedFund);
        const curr = context.costPlan?.dest_currency || 'EUR';
        return `### Mobility Cost & Financial Summary\n\n- **Estimated Pre-Departure Costs**: ${curr} ${Math.round(pre).toLocaleString()}\n- **Estimated First-Month Relocation**: ${curr} ${Math.round(first).toLocaleString()}\n- **Estimated Year-One Total Budget**: ${curr} ${Math.round(yearOne).toLocaleString()}\n- **Confirmed Funding**: ${curr} ${Math.round(confirmedFund).toLocaleString()}\n- **Estimated Funding Gap**: ${curr} ${Math.round(gap).toLocaleString()}\n${largestItem ? `- **Largest Planned Item**: **${largestItem.name}** (${curr} ${parseFloat(largestItem.estimated_amount).toLocaleString()})` : ''}\n\n*Visit the **Cost Planner** to record confirmed scholarships or adjust estimates.*`;
    }
    // Missing requirements
    if (q.includes('missing') || q.includes('need') || q.includes('upload') || q.includes('checklist')) {
        if (missingReqs.length === 0) {
            return `### Requirement Status: Complete\n\nAll mandatory requirements for your **${j.from_country} → ${j.to_country} (${j.purpose})** journey have been uploaded! Your current readiness score is **${context.readinessScore}%**.\n\nNext step: Submit your uploaded files for official verification or review the consular visa application stage.`;
        }
        const items = missingReqs.map(r => `- **${r.title}** (${r.category}): ${r.description}`).join('\n');
        return `### Pending Mandatory Requirements (${missingReqs.length} Remaining)\n\nFor your **${j.from_country} → ${j.to_country} (${j.purpose})** roadmap, the following mandatory items are pending upload:\n\n${items}\n\n*Head to the **Document Vault** to securely upload and analyze these records.*`;
    }
    // Scholarships
    if (q.includes('scholarship') || q.includes('grant')) {
        if (context.scholarships && context.scholarships.length > 0) {
            const schList = context.scholarships.map(s => `- **${s.name}**\n  - *Provider*: ${s.provider}\n  - *Funding*: ${s.funding_type} | *Level*: ${s.level}\n  - *Deadline*: ${s.deadline}\n  - *Official Source*: [Verify Details](${s.official_source})`).join('\n\n');
            return `### Recommended Opportunities for ${j.to_country}\n\nHere are curated opportunities currently matching your destination:\n\n${schList}\n\n*(Remember: Finding a scholarship does not count as confirmed funding until you mark it as AWARDED in your Cost Planner!)*`;
        }
        return `No specific scholarships currently stored for ${j.to_country}. Check the Opportunities Explorer for global cross-border grants.`;
    }
    // Simulation
    if (q.includes('japan') || q.includes('canada') || q.includes('simulate') || q.includes('compare') || q.includes('change')) {
        return `### Mobility Twin Scenario Simulator\n\nYou can simulate and compare alternative destinations directly without changing your current journey:\n1. Open **Mobility Twin** from your dashboard.\n2. Click **Run Scenario Simulator**.\n3. Choose alternative destinations (e.g. Japan, Canada, UK, Australia).\n4. Review the side-by-side differences in requirements, living costs, and visa processing times.\n5. Click **Apply This Scenario** only when you are ready to switch!`;
    }
    // Next steps
    if (q.includes('next') || q.includes('what should i do') || q.includes('blocker')) {
        if (missingReqs.length > 0) {
            return `### Your Immediate Priority\n\nYour highest impact next action is uploading **${missingReqs[0].title}** to advance stage **${j.current_stage_name}** and boost your overall readiness from **${context.readinessScore}%**.\n\nVisit your **Document Vault** or **Journey Checklist** to proceed.`;
        }
        return `### Recommended Next Step\n\nYour mandatory checklist is satisfied. We recommend verifying your financial proof in **Cost Planner** and generating a **Selective Disclosure Share Package** for institutional pre-verification.`;
    }
    // Default summary
    return `### MidBridge 2.0 Journey Intelligence\n\n**Current Route**: ${j.from_country} → ${j.to_country} (${j.purpose})\n**Current Stage**: Stage ${j.current_stage_number}: ${j.current_stage_name}\n**Readiness Level**: ${context.readinessScore}%\n**Vault Documents**: ${uploadedDocs.length} | **Health Records**: ${healthDocs.length}\n**Missing Mandatory Items**: ${missingReqs.length}\n\nHow can I assist you further? You can ask me:\n- *"What health documents are incomplete?"*\n- *"What is my estimated preparation cost?"*\n- *"What is my largest planned expense?"*\n- *"What documents am I missing?"*\n- *"How do I simulate a journey to Japan?"*`;
}
