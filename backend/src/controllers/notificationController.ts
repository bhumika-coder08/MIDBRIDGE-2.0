import { Request, Response } from 'express';
import { query } from '../db/db.js';

export async function getNotifications(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const result = await query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );

    const unreadCount = result.rows.filter(n => !n.is_read).length;
    res.json({
      notifications: result.rows,
      unreadCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
}

export async function markAsRead(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    await query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    res.json({ message: 'Notification marked as read.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update notification.' });
  }
}

export async function markAllAsRead(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    await query(`UPDATE notifications SET is_read = true WHERE user_id = $1`, [userId]);
    res.json({ message: 'All notifications marked as read.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to mark notifications as read.' });
  }
}
