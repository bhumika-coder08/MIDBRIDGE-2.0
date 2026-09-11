import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { query } from '../db/db.js';
import { calculateJourneyReadiness } from '../services/readinessCalculator.js';
import { logAuditEvent } from '../middleware/audit.js';

export async function requestVerification(req: Request, res: Response): Promise<void> {
  try {
    const { documentId } = req.body;
    const userId = req.user!.id;

    const docRes = await query(`SELECT * FROM documents WHERE id = $1 AND user_id = $2`, [documentId, userId]);
    if (docRes.rows.length === 0) {
      res.status(404).json({ error: 'Document not found in your vault.' });
      return;
    }

    await query(
      `UPDATE documents SET verification_status = 'VERIFICATION_PENDING', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [documentId]
    );

    const doc = docRes.rows[0];
    if (doc.journey_id && doc.requirement_id) {
      await query(
        `UPDATE user_requirements SET status = 'VERIFICATION_PENDING', updated_at = CURRENT_TIMESTAMP
         WHERE journey_id = $1 AND requirement_id = $2`,
        [doc.journey_id, doc.requirement_id]
      );
    }

    await logAuditEvent({
      userId,
      action: 'VERIFICATION_REQUESTED',
      actorRole: req.user!.role,
      resourceType: 'documents',
      resourceId: documentId,
      metadata: { originalName: doc.original_name },
      ipAddress: req.ip,
    });

    res.json({
      message: 'Verification request dispatched to competent verification authorities.',
      verificationStatus: 'VERIFICATION_PENDING',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit document for verification.' });
  }
}

export async function getVerificationQueue(req: Request, res: Response): Promise<void> {
  try {
    // Accessible by AUTHORITY, VERIFIER, and ADMIN
    const result = await query(
      `SELECT d.*, u.email as user_email, p.full_name as user_full_name, p.nationality, p.destination_country,
              j.from_country, j.to_country, j.purpose
       FROM documents d
       JOIN users u ON d.user_id = u.id
       LEFT JOIN profiles p ON u.id = p.user_id
       LEFT JOIN journeys j ON d.journey_id = j.id
       WHERE d.verification_status IN ('VERIFICATION_PENDING', 'VERIFIED', 'REJECTED', 'NEEDS_REVIEW')
       ORDER BY d.created_at DESC`
    );

    const docs = result.rows.map(d => ({
      ...d,
      ai_analysis: d.ai_analysis_json ? JSON.parse(d.ai_analysis_json) : null,
    }));

    res.json({ queue: docs });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve verification queue.' });
  }
}

export async function reviewVerification(req: Request, res: Response): Promise<void> {
  try {
    const { documentId, status, reason } = req.body; // status: 'VERIFIED', 'REJECTED', 'NEEDS_REVIEW'
    const verifierId = req.user!.id;
    const verifierRole = req.user!.role;

    if (!['VERIFIED', 'REJECTED', 'NEEDS_REVIEW'].includes(status)) {
      res.status(400).json({ error: 'Invalid verification decision status.' });
      return;
    }

    const docRes = await query(`SELECT * FROM documents WHERE id = $1`, [documentId]);
    if (docRes.rows.length === 0) {
      res.status(404).json({ error: 'Target document not found.' });
      return;
    }

    const doc = docRes.rows[0];

    // Compute cryptographic digital signature of the approval
    const sigPayload = `${doc.id}:${doc.file_hash}:${verifierId}:${status}:${Date.now()}`;
    const signatureHash = crypto.createHash('sha256').update(sigPayload).digest('hex');

    const verifId = uuidv4();
    await query(
      `INSERT INTO document_verifications (id, document_id, verifier_id, verifier_role, status, reason, signature_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [verifId, documentId, verifierId, verifierRole, status, reason || 'Document authenticity verified by competent authority.', signatureHash]
    );

    // Update document status
    await query(
      `UPDATE documents SET verification_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [status, documentId]
    );

    // Update requirement status if linked
    if (doc.journey_id && doc.requirement_id) {
      await query(
        `UPDATE user_requirements SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE journey_id = $2 AND requirement_id = $3`,
        [status, doc.journey_id, doc.requirement_id]
      );
    }

    // Recalculate journey readiness
    let readiness = null;
    if (doc.journey_id) {
      readiness = await calculateJourneyReadiness(doc.journey_id);
    }

    // Create user in-app notification
    const notifId = uuidv4();
    await query(
      `INSERT INTO notifications (id, user_id, title, message, category, link_url)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        notifId,
        doc.user_id,
        `Verification Update: ${doc.original_name}`,
        `Your document has been reviewed with status: ${status}. ${reason ? `Authority Note: ${reason}` : ''}`,
        'VERIFICATION_RESULT',
        '/verification'
      ]
    );

    await logAuditEvent({
      userId: verifierId,
      action: `DOCUMENT_VERIFICATION_${status}`,
      actorRole: verifierRole,
      resourceType: 'documents',
      resourceId: documentId,
      metadata: { status, reason, signatureHash },
      ipAddress: req.ip,
    });

    res.json({
      message: `Verification decision recorded: ${status}`,
      verificationId: verifId,
      signatureHash,
      readiness,
    });
  } catch (err: any) {
    console.error('Error reviewing verification:', err);
    res.status(500).json({ error: 'Failed to record verification decision.' });
  }
}
