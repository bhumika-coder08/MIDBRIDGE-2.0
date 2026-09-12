"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = getNotifications;
exports.markAsRead = markAsRead;
exports.markAllAsRead = markAllAsRead;
const db_js_1 = require("../db/db.js");
async function getNotifications(req, res) {
    try {
        const userId = req.user.id;
        const result = await (0, db_js_1.query)(`SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`, [userId]);
        const unreadCount = result.rows.filter(n => !n.is_read).length;
        res.json({
            notifications: result.rows,
            unreadCount,
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to retrieve notifications.' });
    }
}
async function markAsRead(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await (0, db_js_1.query)(`UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`, [id, userId]);
        res.json({ message: 'Notification marked as read.' });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update notification.' });
    }
}
async function markAllAsRead(req, res) {
    try {
        const userId = req.user.id;
        await (0, db_js_1.query)(`UPDATE notifications SET is_read = true WHERE user_id = $1`, [userId]);
        res.json({ message: 'All notifications marked as read.' });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to mark notifications as read.' });
    }
}
