import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/db.js';
import { generateJourneyRequirements } from '../services/requirementEngine.js';
import { calculateJourneyReadiness } from '../services/readinessCalculator.js';
import { logAuditEvent } from '../middleware/audit.js';

export async function getMobilityTwin(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;

    // 1. Fetch Profile & Active Journey
    const profileRes = await query(`SELECT * FROM profiles WHERE user_id = $1`, [userId]);
    const profile = profileRes.rows[0] || null;

    const journeyRes = await query(
      `SELECT * FROM journeys WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [userId]
    );
    const journey = journeyRes.rows[0] || null;

    if (!journey) {
      res.json({
        hasJourney: false,
        message: 'No active journey found. Initialize a route in Journey Builder to activate Mobility Twin.',
      });
      return;
    }

    // 2. Fetch User Requirements
    const reqsRes = await query(
      `SELECT ur.*, r.category, r.title, r.description, r.mandatory, r.stage_number
       FROM user_requirements ur
       JOIN requirements r ON ur.requirement_id = r.id
       WHERE ur.journey_id = $1
       ORDER BY r.stage_number ASC`,
      [journey.id]
    );
    const requirements = reqsRes.rows;

    // 3. Fetch Vault Documents
    const docsRes = await query(`SELECT * FROM documents WHERE user_id = $1`, [userId]);
    const documents = docsRes.rows;

    // 4. Fetch Health Documents
    const healthDocsRes = await query(`SELECT * FROM health_documents WHERE user_id = $1`, [userId]);
    const healthDocs = healthDocsRes.rows;

    // 5. Fetch Cost Plan & Funding
    const planRes = await query(`SELECT * FROM cost_plans WHERE user_id = $1`, [userId]);
    const plan = planRes.rows[0] || null;

    let confirmedFunding = 0;
    let yearOneCost = 0;
    if (plan) {
      const itemsRes = await query(`SELECT * FROM cost_items WHERE plan_id = $1`, [plan.id]);
      let pre = 0, first = 0, monthly = 0;
      for (const item of itemsRes.rows) {
        const amt = parseFloat(item.estimated_amount) || 0;
        if (item.timing === 'PRE_DEPARTURE') pre += amt;
        else if (item.timing === 'FIRST_MONTH') first += amt;
        else if (item.timing === 'MONTHLY_RECURRING') monthly += amt;
      }
      yearOneCost = pre + first + (monthly * 11);

      const fundRes = await query(
        `SELECT * FROM funding_sources WHERE plan_id = $1 AND status = 'AWARDED_CONFIRMED'`,
        [plan.id]
      );
      for (const f of fundRes.rows) {
        confirmedFunding += parseFloat(f.amount) || 0;
      }
    }

    // 6. Calculate Component Readiness from REAL stored data
    const mandatoryReqs = requirements.filter(r => r.mandatory);
    const satisfiedReqs = mandatoryReqs.filter(r => ['UPLOADED', 'AI_ANALYZED', 'VERIFIED'].includes(r.status));
    const docReadiness = mandatoryReqs.length > 0
      ? Math.round((satisfiedReqs.length / mandatoryReqs.length) * 100)
      : 80;

    // Health readiness
    const standardHealthCategories = ['HEALTH_INSURANCE', 'VACCINATION', 'MEDICAL_FITNESS'];
    const satisfiedHealth = standardHealthCategories.filter(cat =>
      healthDocs.some(hd => hd.category === cat && (!hd.expiry_date || new Date(hd.expiry_date) > new Date()))
    );
    const healthReadiness = Math.round((satisfiedHealth.length / standardHealthCategories.length) * 100);

    // Financial readiness
    const financialReadiness = yearOneCost > 0
      ? Math.min(100, Math.round((confirmedFunding / yearOneCost) * 100))
      : 50;

    // Visa readiness
    const visaReqs = requirements.filter(r => r.category === 'Immigration' || r.stage_number === 7);
    const satisfiedVisa = visaReqs.filter(r => ['UPLOADED', 'VERIFIED'].includes(r.status));
    const visaReadiness = visaReqs.length > 0
      ? Math.round((satisfiedVisa.length / visaReqs.length) * 100)
      : (journey.current_stage_number >= 7 ? 60 : 30);

    // Travel & Arrival readiness
    const travelReadiness = journey.current_stage_number >= 10 ? 80 : 35;
    const arrivalReadiness = journey.current_stage_number >= 11 ? 90 : 20;

    // Deterministic overall readiness
    const overallReadiness = Math.round(
      docReadiness * 0.25 +
      healthReadiness * 0.20 +
      financialReadiness * 0.20 +
      visaReadiness * 0.15 +
      travelReadiness * 0.10 +
      arrivalReadiness * 0.10
    );

    // Determine current blocker
    const firstMissingReq = mandatoryReqs.find(r => !['UPLOADED', 'AI_ANALYZED', 'VERIFIED'].includes(r.status));
    const currentBlocker = firstMissingReq
      ? `Pending upload: ${firstMissingReq.title} (${firstMissingReq.category})`
      : healthReadiness < 100
      ? 'Mandatory statutory health insurance or vaccination record missing'
      : financialReadiness < 50
      ? 'Confirmed financial funding gap exceeds statutory living threshold'
      : 'Awaiting consular biometric appointment confirmation';

    const recommendedAction = firstMissingReq
      ? `Upload and verify '${firstMissingReq.title}' in the Document Vault`
      : healthReadiness < 100
      ? 'Upload statutory health insurance certificate in Health Vault'
      : financialReadiness < 50
      ? 'Record confirmed scholarship, sponsor letter, or blocked account deposit'
      : 'Proceed with consular visa appointment package generation';

    // Build visual journey stages pipeline nodes
    const origin = journey.from_country || profile?.nationality || 'Origin';
    const destination = journey.to_country || 'Destination';

    const stageNodes = [
      { id: 'node-1', label: origin, sub: 'Route Origin', status: 'COMPLETED' },
      { id: 'node-2', label: 'Documentation', sub: `${satisfiedReqs.length}/${mandatoryReqs.length} Ready`, status: docReadiness >= 100 ? 'COMPLETED' : docReadiness >= 50 ? 'ACTIVE' : 'PENDING' },
      { id: 'node-3', label: 'Admission & Purpose', sub: journey.purpose, status: journey.current_stage_number >= 4 ? 'COMPLETED' : 'ACTIVE' },
      { id: 'node-4', label: 'Health Vault', sub: `${healthReadiness}% Compliant`, status: healthReadiness >= 100 ? 'COMPLETED' : healthReadiness >= 50 ? 'ACTIVE' : 'BLOCKED' },
      { id: 'node-5', label: 'Finance & Solvency', sub: `${financialReadiness}% Funded`, status: financialReadiness >= 80 ? 'COMPLETED' : financialReadiness >= 40 ? 'ACTIVE' : 'BLOCKED' },
      { id: 'node-6', label: 'Visa & Biometrics', sub: `Stage ${journey.current_stage_number}/12`, status: visaReadiness >= 80 ? 'COMPLETED' : journey.current_stage_number >= 7 ? 'ACTIVE' : 'PENDING' },
      { id: 'node-7', label: 'Travel Protocol', sub: `${travelReadiness}% Prepared`, status: travelReadiness >= 80 ? 'COMPLETED' : 'PENDING' },
      { id: 'node-8', label: destination, sub: 'Border Entry', status: arrivalReadiness >= 80 ? 'COMPLETED' : 'PENDING' },
      { id: 'node-9', label: 'Arrival & Settling', sub: 'Municipal Registration', status: arrivalReadiness >= 80 ? 'COMPLETED' : 'PENDING' },
    ];

    res.json({
      hasJourney: true,
      twin: {
        journeyId: journey.id,
        origin,
        destination,
        purpose: journey.purpose,
        currentStageNumber: journey.current_stage_number,
        currentStageName: journey.current_stage_name,
        overallReadiness,
        components: {
          docReadiness,
          docCount: documents.length,
          mandatoryCount: mandatoryReqs.length,
          satisfiedCount: satisfiedReqs.length,
          healthReadiness,
          healthDocCount: healthDocs.length,
          financialReadiness,
          yearOneCost: Math.round(yearOneCost),
          confirmedFunding: Math.round(confirmedFunding),
          visaReadiness,
          travelReadiness,
          arrivalReadiness,
        },
        currentBlocker,
        recommendedAction,
        stageNodes,
      }
    });
  } catch (err: any) {
    console.error('Mobility Twin error:', err);
    res.status(500).json({ error: 'Failed to retrieve Mobility Twin.' });
  }
}

export async function simulateScenario(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { simulatedDestination, simulatedPurpose } = req.body;

    if (!simulatedDestination) {
      res.status(400).json({ error: 'Please choose a destination country to simulate.' });
      return;
    }

    // Get current active journey for comparison
    const journeyRes = await query(
      `SELECT * FROM journeys WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [userId]
    );
    const currentJourney = journeyRes.rows[0] || null;

    const origin = currentJourney ? currentJourney.from_country : 'India';
    const currentDest = currentJourney ? currentJourney.to_country : 'Germany';
    const currentPurpose = currentJourney ? currentJourney.purpose : 'Study';
    const targetPurpose = simulatedPurpose || currentPurpose;

    // Query destination country info
    const destRes = await query(
      `SELECT * FROM countries WHERE name = $1 OR code = $1 LIMIT 1`,
      [simulatedDestination]
    );
    const destCountry = destRes.rows[0] || {
      name: simulatedDestination,
      code: simulatedDestination.slice(0, 2).toUpperCase(),
      currency: 'USD',
      avg_processing_weeks: 6,
    };

    // Query requirements for simulated destination + purpose
    const simReqsRes = await query(
      `SELECT * FROM requirements WHERE destination = $1 AND purpose = $2`,
      [destCountry.code, targetPurpose]
    );
    const simulatedRequirements = simReqsRes.rows;

    // Check user's uploaded documents against simulated requirements
    const userDocs = await query(`SELECT * FROM documents WHERE user_id = $1`, [userId]);
    const docs = userDocs.rows;

    const matchedReqs = simulatedRequirements.filter(sr =>
      docs.some(d => d.category.toLowerCase() === sr.category.toLowerCase() || d.original_name.toLowerCase().includes(sr.title.toLowerCase().slice(0, 6)))
    );

    const missingReqs = simulatedRequirements.filter(sr => !matchedReqs.includes(sr));
    const simDocScore = simulatedRequirements.length > 0
      ? Math.round((matchedReqs.length / simulatedRequirements.length) * 100)
      : 70;

    // Approximate cost comparison
    const destCode = destCountry.code.toUpperCase();
    const livingCostEstimate = destCode === 'US' ? 15000
      : destCode === 'GB' ? 13500
      : destCode === 'JP' ? 11000
      : destCode === 'CA' ? 14000
      : destCode === 'AU' ? 14500
      : 11904;

    const visaProcessingWeeks = destCountry.avg_processing_weeks || 6;

    // Simulated health requirements
    const simHealthReqs = [
      'Valid International Health Insurance',
      destCode === 'US' || destCode === 'CA' ? 'Tuberculosis (TB) Screening Test' : 'Comprehensive Medical Examination',
      'National Childhood Vaccination Records',
    ];

    const simSnapshotId = uuidv4();
    const simSummary = {
      simulatedDestination: destCountry.name,
      simulatedPurpose: targetPurpose,
      visaProcessingWeeks,
      estimatedLivingProofAmount: livingCostEstimate,
      currency: destCountry.currency || 'EUR',
      simulatedRequirementsCount: simulatedRequirements.length,
      alreadySatisfiedRequirements: matchedReqs.map(r => r.title),
      pendingRequirements: missingReqs.map(r => r.title),
      simulatedDocReadiness: simDocScore,
      simulatedOverallReadiness: Math.round(simDocScore * 0.5 + 25),
      healthRequirements: simHealthReqs,
    };

    await query(
      `INSERT INTO mobility_simulations (id, user_id, origin_country, dest_country, purpose, simulation_name, diff_summary_json, simulated_readiness)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        simSnapshotId,
        userId,
        origin,
        destCountry.name,
        targetPurpose,
        `${origin} → ${destCountry.name} (${targetPurpose})`,
        JSON.stringify(simSummary),
        simSummary.simulatedOverallReadiness,
      ]
    );

    await logAuditEvent({
      userId,
      action: 'MOBILITY_SIMULATION_RUN',
      actorRole: req.user!.role,
      resourceType: 'mobility_simulations',
      resourceId: simSnapshotId,
      metadata: { dest: destCountry.name, purpose: targetPurpose },
      ipAddress: req.ip,
    });

    res.json({
      message: 'Simulation computed without modifying active journey.',
      comparison: {
        current: {
          destination: currentDest,
          purpose: currentPurpose,
        },
        simulated: {
          destination: destCountry.name,
          purpose: targetPurpose,
          flag: destCountry.flag || '🌐',
          visaProcessingWeeks,
          currency: destCountry.currency || 'EUR',
          estimatedLivingProof: livingCostEstimate,
          simulatedReadiness: simSummary.simulatedOverallReadiness,
          matchedRequirements: matchedReqs.map(r => ({ title: r.title, category: r.category })),
          missingRequirements: missingReqs.map(r => ({ title: r.title, category: r.category })),
          healthRequirements: simHealthReqs,
        },
        simulationId: simSnapshotId,
      }
    });
  } catch (err: any) {
    console.error('Simulation error:', err);
    res.status(500).json({ error: 'Failed to run scenario simulation.' });
  }
}

export async function applySimulatedScenario(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { destination, purpose } = req.body;

    if (!destination || !purpose) {
      res.status(400).json({ error: 'Please specify target destination and purpose to apply.' });
      return;
    }

    // 1. Find or create journey
    const journeyRes = await query(
      `SELECT * FROM journeys WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [userId]
    );
    let journey = journeyRes.rows[0];

    // Find destination code
    const countryRes = await query(`SELECT code, name FROM countries WHERE name = $1 OR code = $1 LIMIT 1`, [destination]);
    const destName = countryRes.rows.length > 0 ? countryRes.rows[0].name : destination;
    const destCode = countryRes.rows.length > 0 ? countryRes.rows[0].code : destination.slice(0, 2).toUpperCase();

    if (journey) {
      await query(
        `UPDATE journeys SET to_country = $1, purpose = $2, current_stage_number = 1, current_stage_name = 'Researching & Requirements Discovery', updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [destName, purpose, journey.id]
      );
    } else {
      const newJourneyId = uuidv4();
      await query(
        `INSERT INTO journeys (id, user_id, from_country, to_country, purpose, current_stage_number, current_stage_name)
         VALUES ($1, $2, 'India', $3, $4, 1, 'Researching & Requirements Discovery')`,
        [newJourneyId, userId, destName, purpose]
      );
      journey = { id: newJourneyId };
    }

    // 2. Populate requirements for new route
    await generateJourneyRequirements(journey.id, destCode, purpose, 'India');

    // 3. Update profile
    await query(
      `UPDATE profiles SET destination_country = $1, purpose = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3`,
      [destName, purpose, userId]
    );

    // 4. Recalculate readiness
    const readiness = await calculateJourneyReadiness(journey.id);

    await logAuditEvent({
      userId,
      action: 'MOBILITY_SCENARIO_APPLIED',
      actorRole: req.user!.role,
      resourceType: 'journeys',
      resourceId: journey.id,
      metadata: { newDestination: destName, newPurpose: purpose },
      ipAddress: req.ip,
    });

    res.json({
      message: `Scenario applied! Your active journey is now ${journey.from_country || 'Origin'} → ${destName} (${purpose}).`,
      journeyId: journey.id,
      readiness,
    });
  } catch (err: any) {
    console.error('Apply simulation error:', err);
    res.status(500).json({ error: 'Failed to apply scenario to active journey.' });
  }
}
