import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { query } from '../db/db.js';
import { logAuditEvent } from '../middleware/audit.js';
export async function getEmergencyProfile(req, res) {
    try {
        const userId = req.user.id;
        const result = await query(`SELECT * FROM emergency_profiles WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1`, [userId]);
        res.json({ profile: result.rows[0] || null });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to retrieve emergency profile.' });
    }
}
export async function createOrUpdateEmergencyProfile(req, res) {
    try {
        const userId = req.user.id;
        const { fullName, nationality, emergencyContact, bloodGroup, allergiesMedicalNotes, insuranceDetails, embassyInfo, durationDays = 30 } = req.body;
        if (!emergencyContact || !fullName) {
            res.status(400).json({ error: 'Please specify your full name and emergency contact details.' });
            return;
        }
        // Deactivate previous profiles
        await query(`UPDATE emergency_profiles SET is_active = false WHERE user_id = $1`, [userId]);
        const id = uuidv4();
        const token = `emg_${crypto.randomBytes(12).toString('hex')}`;
        const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
        await query(`INSERT INTO emergency_profiles (id, user_id, token, full_name, nationality, emergency_contact, blood_group, allergies_medical_notes, insurance_details, embassy_info, expires_at, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)`, [id, userId, token, fullName, nationality || 'International Traveler', emergencyContact, bloodGroup || null, allergiesMedicalNotes || null, insuranceDetails || null, embassyInfo || null, expiresAt]);
        await logAuditEvent({
            userId,
            action: 'EMERGENCY_PROFILE_ACTIVATED',
            actorRole: req.user.role,
            resourceType: 'emergency_profiles',
            resourceId: id,
            ipAddress: req.ip,
        });
        res.status(201).json({
            message: 'MidBridge 2.0 Emergency Profile activated with time-limited QR access.',
            token,
            expiresAt,
            emergencyUrl: `/emergency/${token}`,
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to save emergency profile.' });
    }
}
export async function getPublicEmergencyCard(req, res) {
    try {
        const { token } = req.params;
        const result = await query(`SELECT full_name, nationality, emergency_contact, blood_group, allergies_medical_notes, insurance_details, embassy_info, expires_at, is_active
       FROM emergency_profiles
       WHERE token = $1`, [token]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Emergency profile not found or link has expired.' });
            return;
        }
        const card = result.rows[0];
        if (!card.is_active || new Date(card.expires_at) < new Date()) {
            res.status(410).json({ error: 'This emergency card has been deactivated or has reached its expiration date.' });
            return;
        }
        res.json({ card });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to display emergency card.' });
    }
}
