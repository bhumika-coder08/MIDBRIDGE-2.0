"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReminders = getReminders;
exports.createReminder = createReminder;
exports.toggleReminder = toggleReminder;
exports.deleteReminder = deleteReminder;
const uuid_1 = require("uuid");
const db_js_1 = require("../db/db.js");
async function getReminders(req, res) {
    try {
        const userId = req.user.id;
        const result = await (0, db_js_1.query)(`SELECT * FROM reminders WHERE user_id = $1 ORDER BY due_date ASC`, [userId]);
        res.json({ reminders: result.rows });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to retrieve reminders.' });
    }
}
async function createReminder(req, res) {
    try {
        const userId = req.user.id;
        const { title, dueDate, category, journeyId } = req.body;
        if (!title || !dueDate) {
            res.status(400).json({ error: 'Please provide a title and due date for your reminder.' });
            return;
        }
        const id = (0, uuid_1.v4)();
        await (0, db_js_1.query)(`INSERT INTO reminders (id, user_id, journey_id, title, due_date, category)
       VALUES ($1, $2, $3, $4, $5, $6)`, [id, userId, journeyId || null, title, dueDate, category || 'Mobility Task']);
        res.status(201).json({
            message: 'Reminder successfully scheduled.',
            reminder: { id, title, dueDate, category },
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to create reminder.' });
    }
}
async function toggleReminder(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await (0, db_js_1.query)(`UPDATE reminders SET is_completed = NOT is_completed WHERE id = $1 AND user_id = $2`, [id, userId]);
        res.json({ message: 'Reminder status toggled.' });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update reminder.' });
    }
}
async function deleteReminder(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await (0, db_js_1.query)(`DELETE FROM reminders WHERE id = $1 AND user_id = $2`, [id, userId]);
        res.json({ message: 'Reminder removed.' });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to remove reminder.' });
    }
}
