"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.askAssistant = askAssistant;
exports.getConversationHistory = getConversationHistory;
const uuid_1 = require("uuid");
const db_js_1 = require("../db/db.js");
const aiAssistant_js_1 = require("../services/aiAssistant.js");
async function askAssistant(req, res) {
    try {
        const userId = req.user.id;
        const { prompt, conversationId } = req.body;
        if (!prompt || prompt.trim().length === 0) {
            res.status(400).json({ error: 'Please submit a question for the MidBridge 2.0 Assistant.' });
            return;
        }
        // Retrieve or create conversation
        let convId = conversationId;
        if (!convId) {
            const convRes = await (0, db_js_1.query)(`SELECT id FROM assistant_conversations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`, [userId]);
            if (convRes.rows.length > 0) {
                convId = convRes.rows[0].id;
            }
            else {
                convId = (0, uuid_1.v4)();
                await (0, db_js_1.query)(`INSERT INTO assistant_conversations (id, user_id, title) VALUES ($1, $2, $3)`, [convId, userId, 'Mobility & Readiness Advisory']);
            }
        }
        // Save user message
        const userMsgId = (0, uuid_1.v4)();
        await (0, db_js_1.query)(`INSERT INTO assistant_messages (id, conversation_id, role, content) VALUES ($1, $2, $3, $4)`, [userMsgId, convId, 'user', prompt.trim()]);
        // Assemble user context & generate response
        const context = await (0, aiAssistant_js_1.assembleUserContext)(userId);
        const answer = await (0, aiAssistant_js_1.generateAssistantResponse)(prompt.trim(), context);
        // Save assistant message
        const assistantMsgId = (0, uuid_1.v4)();
        await (0, db_js_1.query)(`INSERT INTO assistant_messages (id, conversation_id, role, content, context_json) VALUES ($1, $2, $3, $4, $5)`, [assistantMsgId, convId, 'assistant', answer, JSON.stringify({ readiness: context.readinessScore, journey: context.journey ? context.journey.id : null })]);
        res.json({
            conversationId: convId,
            answer,
            context: {
                journeyRoute: context.journey ? `${context.journey.from_country} → ${context.journey.to_country}` : null,
                readinessScore: context.readinessScore,
                missingRequirementsCount: context.requirements?.filter(r => r.mandatory && !['UPLOADED', 'VERIFIED'].includes(r.status)).length || 0,
            }
        });
    }
    catch (err) {
        console.error('Assistant error:', err);
        res.status(500).json({ error: 'Failed to process inquiry with MidBridge 2.0 Assistant.' });
    }
}
async function getConversationHistory(req, res) {
    try {
        const userId = req.user.id;
        const convRes = await (0, db_js_1.query)(`SELECT id FROM assistant_conversations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`, [userId]);
        if (convRes.rows.length === 0) {
            res.json({ messages: [] });
            return;
        }
        const convId = convRes.rows[0].id;
        const msgRes = await (0, db_js_1.query)(`SELECT id, role, content, created_at FROM assistant_messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT 50`, [convId]);
        res.json({
            conversationId: convId,
            messages: msgRes.rows,
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to retrieve conversation history.' });
    }
}
