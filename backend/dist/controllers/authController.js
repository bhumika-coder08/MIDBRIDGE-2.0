"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signup = signup;
exports.login = login;
exports.getMe = getMe;
exports.updateProfile = updateProfile;
exports.adminLogin = adminLogin;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const db_js_1 = require("../db/db.js");
const audit_js_1 = require("../middleware/audit.js");
const JWT_SECRET = process.env.JWT_SECRET || 'midbridge_jwt_super_secret_production_key_2026_9831a';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
async function signup(req, res) {
    try {
        const { email, password, fullName, nationality, destinationCountry, purpose, role } = req.body;
        if (!email || !password || !fullName) {
            res.status(400).json({ error: 'Please provide full name, email address, and password.' });
            return;
        }
        // Check if user already exists
        const existing = await (0, db_js_1.query)(`SELECT id FROM users WHERE email = $1`, [email.toLowerCase().trim()]);
        if (existing.rows.length > 0) {
            res.status(409).json({ error: 'An account with this email address already exists. Please log in.' });
            return;
        }
        const assignedRole = ['ADMIN', 'AUTHORITY', 'UNIVERSITY', 'VERIFIER'].includes(role) ? role : 'USER';
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const userId = (0, uuid_1.v4)();
        await (0, db_js_1.query)(`INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, $3, $4)`, [userId, email.toLowerCase().trim(), passwordHash, assignedRole]);
        const profileId = (0, uuid_1.v4)();
        await (0, db_js_1.query)(`INSERT INTO profiles (id, user_id, full_name, nationality, current_country, destination_country, purpose)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`, [profileId, userId, fullName.trim(), nationality || 'India', nationality || 'India', destinationCountry || 'Germany', purpose || 'Study']);
        await (0, audit_js_1.logAuditEvent)({
            userId,
            action: 'USER_REGISTERED',
            actorRole: assignedRole,
            resourceType: 'users',
            resourceId: userId,
            ipAddress: req.ip,
        });
        const token = jsonwebtoken_1.default.sign({ id: userId, email: email.toLowerCase().trim(), role: assignedRole }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        });
        res.status(201).json({
            message: 'Account created successfully.',
            token,
            user: {
                id: userId,
                email: email.toLowerCase().trim(),
                role: assignedRole,
                fullName: fullName.trim(),
            }
        });
    }
    catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Failed to create user account. Please try again.' });
    }
}
async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Please enter your email and password.' });
            return;
        }
        const userRes = await (0, db_js_1.query)(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase().trim()]);
        if (userRes.rows.length === 0) {
            res.status(401).json({ error: 'Invalid email address or password.' });
            return;
        }
        const user = userRes.rows[0];
        const match = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!match) {
            res.status(401).json({ error: 'Invalid email address or password.' });
            return;
        }
        const profileRes = await (0, db_js_1.query)(`SELECT * FROM profiles WHERE user_id = $1`, [user.id]);
        const profile = profileRes.rows[0] || null;
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        });
        await (0, audit_js_1.logAuditEvent)({
            userId: user.id,
            action: 'USER_LOGIN',
            actorRole: user.role,
            resourceType: 'users',
            resourceId: user.id,
            ipAddress: req.ip,
        });
        res.json({
            message: 'Signed in successfully.',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                fullName: profile ? profile.full_name : user.email.split('@')[0],
                profile,
            }
        });
    }
    catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Authentication failed. Please verify your credentials and try again.' });
    }
}
async function getMe(req, res) {
    try {
        const userId = req.user.id;
        const userRes = await (0, db_js_1.query)(`SELECT id, email, role, created_at FROM users WHERE id = $1`, [userId]);
        if (userRes.rows.length === 0) {
            res.status(404).json({ error: 'User profile not found.' });
            return;
        }
        const user = userRes.rows[0];
        const profileRes = await (0, db_js_1.query)(`SELECT * FROM profiles WHERE user_id = $1`, [userId]);
        const profile = profileRes.rows[0] || null;
        res.json({
            user: {
                ...user,
                profile,
            }
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to retrieve profile data.' });
    }
}
async function updateProfile(req, res) {
    try {
        const userId = req.user.id;
        const { fullName, nationality, currentCountry, destinationCountry, purpose, educationLevel, intendedCourse, institution, travelDate, preferredLanguage, } = req.body;
        await (0, db_js_1.query)(`UPDATE profiles SET
        full_name = COALESCE($1, full_name),
        nationality = COALESCE($2, nationality),
        current_country = COALESCE($3, current_country),
        destination_country = COALESCE($4, destination_country),
        purpose = COALESCE($5, purpose),
        education_level = COALESCE($6, education_level),
        intended_course = COALESCE($7, intended_course),
        institution = COALESCE($8, institution),
        travel_date = COALESCE($9, travel_date),
        preferred_language = COALESCE($10, preferred_language),
        updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $11`, [
            fullName,
            nationality,
            currentCountry,
            destinationCountry,
            purpose,
            educationLevel,
            intendedCourse,
            institution,
            travelDate,
            preferredLanguage,
            userId,
        ]);
        const updated = await (0, db_js_1.query)(`SELECT * FROM profiles WHERE user_id = $1`, [userId]);
        res.json({
            message: 'Profile updated successfully.',
            profile: updated.rows[0],
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update profile.' });
    }
}
async function adminLogin(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Please enter administrator email and password.' });
            return;
        }
        const userRes = await (0, db_js_1.query)(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase().trim()]);
        if (userRes.rows.length === 0) {
            res.status(401).json({ error: 'Invalid administrative credentials.' });
            return;
        }
        const user = userRes.rows[0];
        const match = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!match) {
            res.status(401).json({ error: 'Invalid administrative credentials.' });
            return;
        }
        // Explicit Backend RBAC check: Must be ADMIN
        if (user.role !== 'ADMIN') {
            await (0, audit_js_1.logAuditEvent)({
                userId: user.id,
                action: 'UNAUTHORIZED_ADMIN_PORTAL_ATTEMPT',
                actorRole: user.role,
                resourceType: 'admin_portal',
                resourceId: user.id,
                metadata: { email: user.email, attemptedRole: 'ADMIN' },
                ipAddress: req.ip,
            });
            res.status(403).json({
                error: 'Access denied: Administrative privileges required. This incident has been logged.',
                code: 'FORBIDDEN_ROLE',
            });
            return;
        }
        const profileRes = await (0, db_js_1.query)(`SELECT * FROM profiles WHERE user_id = $1`, [user.id]);
        const profile = profileRes.rows[0] || null;
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: 'ADMIN' }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        });
        await (0, audit_js_1.logAuditEvent)({
            userId: user.id,
            action: 'ADMIN_LOGIN_SUCCESS',
            actorRole: 'ADMIN',
            resourceType: 'admin_portal',
            resourceId: user.id,
            ipAddress: req.ip,
        });
        res.json({
            message: 'Administrative authentication confirmed.',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: 'ADMIN',
                fullName: profile ? profile.full_name : 'Platform Administrator',
                profile,
            }
        });
    }
    catch (err) {
        console.error('Admin login error:', err);
        res.status(500).json({ error: 'Administrative authentication failed.' });
    }
}
