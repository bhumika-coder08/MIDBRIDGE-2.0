import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import fs from 'fs';
import { query } from '../db/db.js';
import { analyzeUploadedDocument } from '../services/documentAnalyzer.js';
import { logAuditEvent } from '../middleware/audit.js';
export async function getHealthDocuments(req, res) {
    try {
        const userId = req.user.id;
        const result = await query(`SELECT * FROM health_documents WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
        const docs = result.rows.map(d => ({
            ...d,
            ai_analysis: d.ai_analysis_json ? JSON.parse(d.ai_analysis_json) : null,
        }));
        res.json({ documents: docs });
    }
    catch (err) {
        console.error('Error fetching health documents:', err);
        res.status(500).json({ error: 'Failed to retrieve health vault records.' });
    }
}
export async function uploadHealthDocument(req, res) {
    try {
        const userId = req.user.id;
        const file = req.file;
        if (!file) {
            res.status(400).json({ error: 'Please select a health file to upload (PDF, JPG, or PNG).' });
            return;
        }
        const { category = 'OTHER', title, issuer, issueDate, expiryDate, notes, } = req.body;
        const docTitle = title?.trim() || file.originalname;
        // Analyze document and calculate SHA-256
        const analysis = await analyzeUploadedDocument(file.path, file.originalname, category);
        const docId = uuidv4();
        await query(`INSERT INTO health_documents (
        id, user_id, category, title, original_name, stored_name, file_path, file_size, mime_type, file_hash, status, issuer, issue_date, expiry_date, ai_analysis_json, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`, [
            docId,
            userId,
            category,
            docTitle,
            file.originalname,
            file.filename,
            file.path,
            file.size,
            file.mimetype,
            analysis.fileHash,
            'UPLOADED',
            issuer || analysis.issuer || null,
            issueDate || analysis.issueDate || null,
            expiryDate || analysis.expiryDate || null,
            JSON.stringify(analysis),
            notes || null,
        ]);
        await logAuditEvent({
            userId,
            action: 'HEALTH_DOCUMENT_UPLOADED',
            actorRole: req.user.role,
            resourceType: 'health_documents',
            resourceId: docId,
            metadata: { originalName: file.originalname, category, hash: analysis.fileHash },
            ipAddress: req.ip,
        });
        res.status(201).json({
            message: 'Health document securely stored in Health Vault.',
            document: {
                id: docId,
                title: docTitle,
                category,
                fileHash: analysis.fileHash,
                status: 'UPLOADED',
                originalName: file.originalname,
                expiryDate: expiryDate || analysis.expiryDate,
            }
        });
    }
    catch (err) {
        console.error('Error uploading health document:', err);
        res.status(500).json({ error: 'Failed to process health document upload.' });
    }
}
export async function downloadHealthDocument(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const role = req.user.role;
        const docRes = await query(`SELECT * FROM health_documents WHERE id = $1`, [id]);
        if (docRes.rows.length === 0) {
            res.status(404).json({ error: 'Health document not found.' });
            return;
        }
        const doc = docRes.rows[0];
        const isOwner = doc.user_id === userId;
        if (!isOwner) {
            // Check if document was shared via an active, unrevoked health share package
            const shareCheck = await query(`SELECT hsp.id FROM health_share_packages hsp
         JOIN health_share_documents hsd ON hsp.id = hsd.health_share_id
         WHERE hsd.health_doc_id = $1 AND hsp.is_revoked = false AND hsp.expires_at > CURRENT_TIMESTAMP`, [id]);
            if (shareCheck.rows.length === 0 && role !== 'ADMIN') {
                res.status(403).json({ error: 'Access denied. Health documents are private by default and require explicit sharing.' });
                return;
            }
        }
        if (!fs.existsSync(doc.file_path)) {
            res.status(404).json({ error: 'File data not found on server storage.' });
            return;
        }
        await logAuditEvent({
            userId,
            action: 'HEALTH_DOCUMENT_DOWNLOADED',
            actorRole: role,
            resourceType: 'health_documents',
            resourceId: id,
            metadata: { isOwner },
            ipAddress: req.ip,
        });
        res.download(doc.file_path, doc.original_name);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to download health document.' });
    }
}
export async function deleteHealthDocument(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        // Strict IDOR protection
        const docRes = await query(`SELECT * FROM health_documents WHERE id = $1 AND user_id = $2`, [id, userId]);
        if (docRes.rows.length === 0) {
            res.status(404).json({ error: 'Health document not found or unauthorized.' });
            return;
        }
        const doc = docRes.rows[0];
        if (fs.existsSync(doc.file_path)) {
            fs.unlinkSync(doc.file_path);
        }
        await query(`DELETE FROM health_documents WHERE id = $1`, [id]);
        await logAuditEvent({
            userId,
            action: 'HEALTH_DOCUMENT_DELETED',
            actorRole: req.user.role,
            resourceType: 'health_documents',
            resourceId: id,
            metadata: { originalName: doc.original_name, category: doc.category },
            ipAddress: req.ip,
        });
        res.json({ message: 'Health document removed from Health Vault.' });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to delete health document.' });
    }
}
export async function getHealthReadiness(req, res) {
    try {
        const userId = req.user.id;
        // Find active journey
        const journeyRes = await query(`SELECT * FROM journeys WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`, [userId]);
        const journey = journeyRes.rows[0] || null;
        // Fetch user's health documents
        const docsRes = await query(`SELECT category, status, expiry_date FROM health_documents WHERE user_id = $1`, [userId]);
        const userDocs = docsRes.rows;
        // Standard cross-border mobility health requirements
        const standardRequirements = [
            { id: 'hr-ins', category: 'HEALTH_INSURANCE', title: 'Statutory or International Health Insurance', mandatory: true },
            { id: 'hr-vac', category: 'VACCINATION', title: 'National & Travel Vaccination Record', mandatory: true },
            { id: 'hr-fit', category: 'MEDICAL_FITNESS', title: 'Medical Fitness & Physical Examination Certificate', mandatory: true },
            { id: 'hr-tins', category: 'TRAVEL_INSURANCE', title: 'Travel Health Insurance (Coverage during Transit)', mandatory: false },
        ];
        const results = standardRequirements.map(reqItem => {
            const matchingDoc = userDocs.find(d => d.category === reqItem.category);
            let status = 'MISSING';
            if (matchingDoc) {
                if (matchingDoc.expiry_date && new Date(matchingDoc.expiry_date) < new Date()) {
                    status = 'EXPIRED';
                }
                else {
                    status = 'READY';
                }
            }
            return {
                ...reqItem,
                status,
            };
        });
        const mandatoryItems = results.filter(r => r.mandatory);
        const readyCount = mandatoryItems.filter(r => r.status === 'READY').length;
        const score = mandatoryItems.length > 0 ? Math.round((readyCount / mandatoryItems.length) * 100) : 100;
        const missingItems = results.filter(r => r.status === 'MISSING').map(r => r.title);
        res.json({
            healthReadinessScore: score,
            items: results,
            missingItems,
            destination: journey ? journey.to_country : 'General International Mobility',
            disclaimer: 'MidBridge 2.0 organizes mobility health documentation. It does not provide medical advice or diagnosis.'
        });
    }
    catch (err) {
        console.error('Health readiness error:', err);
        res.status(500).json({ error: 'Failed to calculate health readiness.' });
    }
}
export async function createHealthSharePackage(req, res) {
    try {
        const userId = req.user.id;
        const { healthDocIds, recipientName, recipientEmail, allowDownload, expiryDays = 7, notes } = req.body;
        if (!healthDocIds || !Array.isArray(healthDocIds) || healthDocIds.length === 0) {
            res.status(400).json({ error: 'Please select at least one health record to share.' });
            return;
        }
        if (!recipientName) {
            res.status(400).json({ error: 'Please specify the recipient institution or health authority name.' });
            return;
        }
        // Verify all health document IDs belong to user
        const checkDocs = await query(`SELECT id FROM health_documents WHERE user_id = $1 AND id = ANY($2::text[])`, [userId, healthDocIds]);
        if (checkDocs.rows.length !== healthDocIds.length) {
            res.status(403).json({ error: 'One or more selected health documents are unauthorized or do not exist.' });
            return;
        }
        const packageId = uuidv4();
        const shareToken = `hlth_${crypto.randomBytes(16).toString('hex')}`;
        const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString();
        await query(`INSERT INTO health_share_packages (id, user_id, share_token, recipient_name, recipient_email, allow_download, expires_at, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [packageId, userId, shareToken, recipientName, recipientEmail || null, !!allowDownload, expiresAt, notes || null]);
        for (const docId of healthDocIds) {
            await query(`INSERT INTO health_share_documents (id, health_share_id, health_doc_id) VALUES ($1, $2, $3)`, [uuidv4(), packageId, docId]);
        }
        await logAuditEvent({
            userId,
            action: 'HEALTH_SHARE_PACKAGE_CREATED',
            actorRole: req.user.role,
            resourceType: 'health_share_packages',
            resourceId: packageId,
            metadata: { recipientName, docCount: healthDocIds.length, token: shareToken },
            ipAddress: req.ip,
        });
        res.status(201).json({
            message: 'Selective health disclosure token generated.',
            packageId,
            shareToken,
            expiresAt,
            shareUrl: `/health/verify/${shareToken}`,
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to create health share package.' });
    }
}
export async function getPublicHealthSharePackageByToken(req, res) {
    try {
        const { token } = req.params;
        const pkgRes = await query(`SELECT hsp.*, p.full_name as user_name, p.nationality
       FROM health_share_packages hsp
       JOIN users u ON hsp.user_id = u.id
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE hsp.share_token = $1`, [token]);
        if (pkgRes.rows.length === 0) {
            res.status(404).json({ error: 'Health verification record not found.' });
            return;
        }
        const pkg = pkgRes.rows[0];
        if (pkg.is_revoked) {
            res.status(410).json({ error: 'Access to this health record has been revoked by the owner.' });
            return;
        }
        if (new Date(pkg.expires_at) < new Date()) {
            res.status(410).json({ error: 'This health verification token has expired.' });
            return;
        }
        // Retrieve ONLY explicitly shared health documents
        const docsRes = await query(`SELECT hd.id, hd.category, hd.title, hd.original_name, hd.file_size, hd.file_hash, hd.status, hd.issuer, hd.issue_date, hd.expiry_date, hd.created_at
       FROM health_documents hd
       JOIN health_share_documents hsd ON hd.id = hsd.health_doc_id
       WHERE hsd.health_share_id = $1`, [pkg.id]);
        await logAuditEvent({
            userId: pkg.user_id,
            action: 'HEALTH_SHARE_ACCESSED',
            actorRole: 'VERIFIER',
            resourceType: 'health_share_packages',
            resourceId: pkg.id,
            metadata: { recipientName: pkg.recipient_name },
            ipAddress: req.ip,
        });
        res.json({
            package: {
                id: pkg.id,
                recipientName: pkg.recipient_name,
                expiresAt: pkg.expires_at,
                allowDownload: pkg.allow_download,
                userName: pkg.user_name,
                nationality: pkg.nationality,
                authorizedHealthDocuments: docsRes.rows,
            }
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to inspect health verification package.' });
    }
}
