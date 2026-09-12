import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { query } from '../db/db.js';
import { logAuditEvent } from '../middleware/audit.js';
export async function createSharePackage(req, res) {
    try {
        const userId = req.user.id;
        const { documentIds, recipientName, recipientEmail, allowDownload, expiryDays = 7, notes } = req.body;
        if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
            res.status(400).json({ error: 'Please select at least one document to include in the share package.' });
            return;
        }
        if (!recipientName) {
            res.status(400).json({ error: 'Please specify recipient entity or organization name (e.g. University Admissions, Embassy).' });
            return;
        }
        // Verify all document IDs belong to the user
        const userDocs = await query(`SELECT id FROM documents WHERE user_id = $1 AND id = ANY($2::text[])`, [userId, documentIds]);
        if (userDocs.rows.length !== documentIds.length) {
            res.status(403).json({ error: 'One or more selected documents are unauthorized or do not exist.' });
            return;
        }
        const packageId = uuidv4();
        const shareToken = `cls_${crypto.randomBytes(16).toString('hex')}`;
        const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString();
        await query(`INSERT INTO share_packages (id, user_id, share_token, recipient_name, recipient_email, allow_download, expires_at, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [packageId, userId, shareToken, recipientName, recipientEmail || null, !!allowDownload, expiresAt, notes || null]);
        for (const docId of documentIds) {
            const linkId = uuidv4();
            await query(`INSERT INTO share_package_documents (id, share_package_id, document_id) VALUES ($1, $2, $3)`, [linkId, packageId, docId]);
        }
        await logAuditEvent({
            userId,
            action: 'SHARE_PACKAGE_CREATED',
            actorRole: req.user.role,
            resourceType: 'share_packages',
            resourceId: packageId,
            metadata: { recipientName, count: documentIds.length, token: shareToken },
            ipAddress: req.ip,
        });
        res.status(201).json({
            message: 'Secure selective disclosure package generated.',
            packageId,
            shareToken,
            expiresAt,
            shareUrl: `/verify/${shareToken}`,
        });
    }
    catch (err) {
        console.error('Error creating share package:', err);
        res.status(500).json({ error: 'Failed to create selective disclosure package.' });
    }
}
export async function getUserSharePackages(req, res) {
    try {
        const userId = req.user.id;
        const pkgsRes = await query(`SELECT sp.*, COUNT(spd.document_id) as document_count
       FROM share_packages sp
       LEFT JOIN share_package_documents spd ON sp.id = spd.share_package_id
       WHERE sp.user_id = $1
       GROUP BY sp.id
       ORDER BY sp.created_at DESC`, [userId]);
        res.json({ packages: pkgsRes.rows });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to retrieve your active share packages.' });
    }
}
export async function revokeSharePackage(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await query(`UPDATE share_packages SET is_revoked = true WHERE id = $1 AND user_id = $2`, [id, userId]);
        await logAuditEvent({
            userId,
            action: 'SHARE_PACKAGE_REVOKED',
            actorRole: req.user.role,
            resourceType: 'share_packages',
            resourceId: id,
            ipAddress: req.ip,
        });
        res.json({ message: 'Selective disclosure access successfully revoked.' });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to revoke package.' });
    }
}
export async function getPublicSharePackageByToken(req, res) {
    try {
        const { token } = req.params;
        const pkgRes = await query(`SELECT sp.*, p.full_name as user_name, p.nationality
       FROM share_packages sp
       JOIN users u ON sp.user_id = u.id
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE sp.share_token = $1`, [token]);
        if (pkgRes.rows.length === 0) {
            res.status(404).json({ error: 'Verification record or share package not found.' });
            return;
        }
        const pkg = pkgRes.rows[0];
        if (pkg.is_revoked) {
            res.status(410).json({ error: 'Access to this share package has been revoked by the document owner.' });
            return;
        }
        if (new Date(pkg.expires_at) < new Date()) {
            res.status(410).json({ error: 'This verification token has expired.' });
            return;
        }
        // Retrieve ONLY the authorized documents linked to this share package
        const docsRes = await query(`SELECT d.id, d.category, d.original_name, d.file_size, d.file_hash, d.verification_status, d.issuer, d.issue_date, d.expiry_date, d.created_at
       FROM documents d
       JOIN share_package_documents spd ON d.id = spd.document_id
       WHERE spd.share_package_id = $1`, [pkg.id]);
        await logAuditEvent({
            userId: pkg.user_id,
            action: 'SHARE_PACKAGE_ACCESSED',
            actorRole: 'VERIFIER',
            resourceType: 'share_packages',
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
                authorizedDocuments: docsRes.rows,
            }
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to inspect verification record.' });
    }
}
