import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { query } from '../db/db.js';
import { analyzeUploadedDocument } from '../services/documentAnalyzer.js';
import { calculateJourneyReadiness } from '../services/readinessCalculator.js';
import { logAuditEvent } from '../middleware/audit.js';

export async function getDocuments(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const result = await query(
      `SELECT d.*, r.title as requirement_title
       FROM documents d
       LEFT JOIN requirements r ON d.requirement_id = r.id
       WHERE d.user_id = $1
       ORDER BY d.created_at DESC`,
      [userId]
    );

    const docs = result.rows.map(d => ({
      ...d,
      ai_analysis: d.ai_analysis_json ? JSON.parse(d.ai_analysis_json) : null,
    }));

    res.json({ documents: docs });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve vault documents.' });
  }
}

export async function uploadDocument(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'Please choose a file to upload (PDF, JPG, or PNG).' });
      return;
    }

    const { category, journeyId, requirementId } = req.body;
    const docCategory = category || 'OTHER';

    // 1. Run Document Analysis & SHA-256 hashing
    const analysis = await analyzeUploadedDocument(file.path, file.originalname, docCategory);

    const docId = uuidv4();
    await query(
      `INSERT INTO documents (
        id, user_id, journey_id, requirement_id, category, original_name, stored_name, file_path, file_size, mime_type, file_hash, ai_analysis_json, verification_status, issuer, issue_date, expiry_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        docId,
        userId,
        journeyId || null,
        requirementId || null,
        docCategory,
        file.originalname,
        file.filename,
        file.path,
        file.size,
        file.mimetype,
        analysis.fileHash,
        JSON.stringify(analysis),
        'AI_ANALYZED',
        analysis.issuer || 'Issuing Authority',
        analysis.issueDate || null,
        analysis.expiryDate || null,
      ]
    );

    // 2. If bound to a requirement, update user_requirements status
    if (journeyId && requirementId) {
      await query(
        `UPDATE user_requirements SET status = 'AI_ANALYZED', updated_at = CURRENT_TIMESTAMP
         WHERE journey_id = $1 AND requirement_id = $2`,
        [journeyId, requirementId]
      );
    }

    // 3. Recalculate journey readiness
    let readiness = null;
    if (journeyId) {
      readiness = await calculateJourneyReadiness(journeyId);
    }

    await logAuditEvent({
      userId,
      action: 'DOCUMENT_UPLOADED',
      actorRole: req.user!.role,
      resourceType: 'documents',
      resourceId: docId,
      metadata: { originalName: file.originalname, size: file.size, hash: analysis.fileHash },
      ipAddress: req.ip,
    });

    res.status(201).json({
      message: 'Document securely uploaded, hashed with SHA-256, and analyzed.',
      document: {
        id: docId,
        originalName: file.originalname,
        fileHash: analysis.fileHash,
        category: docCategory,
        verificationStatus: 'AI_ANALYZED',
        aiAnalysis: analysis,
      },
      readiness,
    });
  } catch (err: any) {
    console.error('Document upload error:', err);
    res.status(500).json({ error: 'Failed to process document upload.' });
  }
}

export async function downloadDocument(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check ownership or elevated roles (ADMIN, AUTHORITY, UNIVERSITY, VERIFIER)
    const docRes = await query(`SELECT * FROM documents WHERE id = $1`, [id]);
    if (docRes.rows.length === 0) {
      res.status(404).json({ error: 'Document not found.' });
      return;
    }

    const doc = docRes.rows[0];
    const isOwner = doc.user_id === userId;
    const role = req.user!.role;

    if (!isOwner) {
      if (role === 'AUTHORITY' || role === 'VERIFIER') {
        const isSubmitted = ['VERIFICATION_PENDING', 'VERIFIED', 'REJECTED', 'NEEDS_REVIEW'].includes(doc.verification_status);
        if (!isSubmitted) {
          res.status(403).json({ error: 'Access denied. Document has not been submitted to the verification workflow.' });
          return;
        }
      } else if (role === 'UNIVERSITY') {
        const shareCheck = await query(
          `SELECT sp.id FROM share_packages sp
           JOIN share_package_documents spd ON sp.id = spd.share_package_id
           WHERE spd.document_id = $1 AND sp.is_revoked = false AND sp.expires_at > CURRENT_TIMESTAMP`,
          [id]
        );
        if (shareCheck.rows.length === 0) {
          res.status(403).json({ error: 'Access denied. This document has not been explicitly shared with institutions.' });
          return;
        }
      } else if (role !== 'ADMIN') {
        res.status(403).json({ error: 'Access denied. You do not have permission to access this document.' });
        return;
      }
    }

    if (!fs.existsSync(doc.file_path)) {
      res.status(404).json({ error: 'File data was not found on server storage.' });
      return;
    }

    await logAuditEvent({
      userId,
      action: 'DOCUMENT_DOWNLOADED',
      actorRole: role,
      resourceType: 'documents',
      resourceId: id,
      metadata: { ownerId: doc.user_id, isOwner },
      ipAddress: req.ip,
    });

    res.download(doc.file_path, doc.original_name);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to download document.' });
  }
}

export async function deleteDocument(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const docRes = await query(`SELECT * FROM documents WHERE id = $1 AND user_id = $2`, [id, userId]);
    if (docRes.rows.length === 0) {
      res.status(404).json({ error: 'Document not found or unauthorized.' });
      return;
    }

    const doc = docRes.rows[0];

    // Remove file from disk
    if (fs.existsSync(doc.file_path)) {
      fs.unlinkSync(doc.file_path);
    }

    // Reset requirement status if was linked
    if (doc.journey_id && doc.requirement_id) {
      await query(
        `UPDATE user_requirements SET status = 'NOT_UPLOADED', updated_at = CURRENT_TIMESTAMP
         WHERE journey_id = $1 AND requirement_id = $2`,
        [doc.journey_id, doc.requirement_id]
      );
    }

    await query(`DELETE FROM documents WHERE id = $1`, [id]);

    let readiness = null;
    if (doc.journey_id) {
      readiness = await calculateJourneyReadiness(doc.journey_id);
    }

    await logAuditEvent({
      userId,
      action: 'DOCUMENT_DELETED',
      actorRole: req.user!.role,
      resourceType: 'documents',
      resourceId: id,
      metadata: { originalName: doc.original_name },
      ipAddress: req.ip,
    });

    res.json({
      message: 'Document deleted from vault.',
      readiness,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete document.' });
  }
}
