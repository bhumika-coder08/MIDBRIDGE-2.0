import { Request, Response } from 'express';
import { query } from '../db/db.js';

export async function getAuthorityStats(_req: Request, res: Response): Promise<void> {
  try {
    const pendingRes = await query(`SELECT COUNT(*) as count FROM documents WHERE verification_status = 'VERIFICATION_PENDING'`);
    const verifiedRes = await query(`SELECT COUNT(*) as count FROM documents WHERE verification_status = 'VERIFIED'`);
    const rejectedRes = await query(`SELECT COUNT(*) as count FROM documents WHERE verification_status = 'REJECTED'`);
    const totalRes = await query(`SELECT COUNT(*) as count FROM documents`);

    res.json({
      pending: parseInt(pendingRes.rows[0].count, 10),
      verified: parseInt(verifiedRes.rows[0].count, 10),
      rejected: parseInt(rejectedRes.rows[0].count, 10),
      totalUploaded: parseInt(totalRes.rows[0].count, 10),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve authority stats.' });
  }
}
