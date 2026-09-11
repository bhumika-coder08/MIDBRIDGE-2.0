import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/db.js';

export async function getReminders(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const result = await query(
      `SELECT * FROM reminders WHERE user_id = $1 ORDER BY due_date ASC`,
      [userId]
    );

    res.json({ reminders: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve reminders.' });
  }
}

export async function createReminder(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { title, dueDate, category, journeyId } = req.body;

    if (!title || !dueDate) {
      res.status(400).json({ error: 'Please provide a title and due date for your reminder.' });
      return;
    }

    const id = uuidv4();
    await query(
      `INSERT INTO reminders (id, user_id, journey_id, title, due_date, category)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, userId, journeyId || null, title, dueDate, category || 'Mobility Task']
    );

    res.status(201).json({
      message: 'Reminder successfully scheduled.',
      reminder: { id, title, dueDate, category },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create reminder.' });
  }
}

export async function toggleReminder(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    await query(
      `UPDATE reminders SET is_completed = NOT is_completed WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    res.json({ message: 'Reminder status toggled.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update reminder.' });
  }
}

export async function deleteReminder(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    await query(`DELETE FROM reminders WHERE id = $1 AND user_id = $2`, [id, userId]);
    res.json({ message: 'Reminder removed.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to remove reminder.' });
  }
}
