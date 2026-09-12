import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/db.js';
import { logAuditEvent } from '../middleware/audit.js';

const JWT_SECRET = process.env.JWT_SECRET || 'midbridge_jwt_super_secret_production_key_2026_9831a';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export async function signup(req: Request, res: Response): Promise<void> {
  console.log('[AUTH-SIGNUP] Incoming registration attempt for role:', req.body?.role || 'USER');
  try {
    const { email, password, fullName, nationality, destinationCountry, purpose, role } = req.body;

    if (!email || !password || !fullName) {
      console.warn('[AUTH-SIGNUP] Validation failed: missing full name, email, or password');
      res.status(400).json({ error: 'Please provide full name, email address, and password.' });
      return;
    }

    // Check if user already exists
    console.log('[AUTH-SIGNUP] Querying existing user email...');
    const existing = await query(`SELECT id FROM users WHERE email = $1`, [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      console.log('[AUTH-SIGNUP] Account already exists for email');
      res.status(409).json({ error: 'An account with this email address already exists. Please log in.' });
      return;
    }

    const assignedRole = ['ADMIN', 'AUTHORITY', 'UNIVERSITY', 'VERIFIER'].includes(role) ? role : 'USER';
    console.log('[AUTH-SIGNUP] Hashing password with bcrypt...');
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    console.log('[AUTH-SIGNUP] Inserting new user record...');
    await query(
      `INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
      [userId, email.toLowerCase().trim(), passwordHash, assignedRole]
    );

    const profileId = uuidv4();
    console.log('[AUTH-SIGNUP] Inserting new user profile...');
    await query(
      `INSERT INTO profiles (id, user_id, full_name, nationality, current_country, destination_country, purpose)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [profileId, userId, fullName.trim(), nationality || 'India', nationality || 'India', destinationCountry || 'Germany', purpose || 'Study']
    );

    try {
      await logAuditEvent({
        userId,
        action: 'USER_REGISTERED',
        actorRole: assignedRole,
        resourceType: 'users',
        resourceId: userId,
        ipAddress: req.ip,
      });
    } catch (auditErr: any) {
      console.warn('[AUTH-SIGNUP] Audit log notice:', auditErr.message);
    }

    console.log('[AUTH-SIGNUP] Generating JWT session token...');
    const token = jwt.sign({ id: userId, email: email.toLowerCase().trim(), role: assignedRole }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as any,
    });

    console.log('✓ [AUTH-SIGNUP] User successfully registered with ID:', userId);
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
  } catch (err: any) {
    console.error('[AUTH-SIGNUP-ERROR] Exception during user registration:', err && err.stack ? err.stack : err);
    res.status(500).json({
      error: 'Failed to create user account. Please try again.',
      details: err && err.message ? err.message : 'Unknown registration error',
    });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Please enter your email and password.' });
      return;
    }

    const userRes = await query(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase().trim()]);
    if (userRes.rows.length === 0) {
      res.status(401).json({ error: 'Invalid email address or password.' });
      return;
    }

    const user = userRes.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      res.status(401).json({ error: 'Invalid email address or password.' });
      return;
    }

    const profileRes = await query(`SELECT * FROM profiles WHERE user_id = $1`, [user.id]);
    const profile = profileRes.rows[0] || null;

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as any,
    });

    await logAuditEvent({
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
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Authentication failed. Please verify your credentials and try again.' });
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const userRes = await query(`SELECT id, email, role, created_at FROM users WHERE id = $1`, [userId]);
    if (userRes.rows.length === 0) {
      res.status(404).json({ error: 'User profile not found.' });
      return;
    }

    const user = userRes.rows[0];
    const profileRes = await query(`SELECT * FROM profiles WHERE user_id = $1`, [userId]);
    const profile = profileRes.rows[0] || null;

    res.json({
      user: {
        ...user,
        profile,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve profile data.' });
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const {
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
    } = req.body;

    await query(
      `UPDATE profiles SET
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
       WHERE user_id = $11`,
      [
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
      ]
    );

    const updated = await query(`SELECT * FROM profiles WHERE user_id = $1`, [userId]);

    res.json({
      message: 'Profile updated successfully.',
      profile: updated.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
}

export async function adminLogin(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Please enter administrator email and password.' });
      return;
    }

    const userRes = await query(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase().trim()]);
    if (userRes.rows.length === 0) {
      res.status(401).json({ error: 'Invalid administrative credentials.' });
      return;
    }

    const user = userRes.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      res.status(401).json({ error: 'Invalid administrative credentials.' });
      return;
    }

    // Explicit Backend RBAC check: Must be ADMIN
    if (user.role !== 'ADMIN') {
      await logAuditEvent({
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

    const profileRes = await query(`SELECT * FROM profiles WHERE user_id = $1`, [user.id]);
    const profile = profileRes.rows[0] || null;

    const token = jwt.sign({ id: user.id, email: user.email, role: 'ADMIN' }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as any,
    });

    await logAuditEvent({
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
  } catch (err: any) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Administrative authentication failed.' });
  }
}

