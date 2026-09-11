import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/db.js';
import { assembleUserContext, generateAssistantResponse } from '../services/aiAssistant.js';

export async function askAssistant(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { prompt, conversationId } = req.body;

    if (!prompt || prompt.trim().length === 0) {
      res.status(400).json({ error: 'Please submit a question for the MidBridge 2.0 Assistant.' });
      return;
    }

    // Retrieve or create conversation
    let convId = conversationId;
    if (!convId) {
      const convRes = await query(
        `SELECT id FROM assistant_conversations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );
      if (convRes.rows.length > 0) {
        convId = convRes.rows[0].id;
      } else {
        convId = uuidv4();
        await query(
          `INSERT INTO assistant_conversations (id, user_id, title) VALUES ($1, $2, $3)`,
          [convId, userId, 'Mobility & Readiness Advisory']
        );
      }
    }

    // Save user message
    const userMsgId = uuidv4();
    await query(
      `INSERT INTO assistant_messages (id, conversation_id, role, content) VALUES ($1, $2, $3, $4)`,
      [userMsgId, convId, 'user', prompt.trim()]
    );

    // Assemble user context & generate response
    const context = await assembleUserContext(userId);
    const answer = await generateAssistantResponse(prompt.trim(), context);

    // Save assistant message
    const assistantMsgId = uuidv4();
    await query(
      `INSERT INTO assistant_messages (id, conversation_id, role, content, context_json) VALUES ($1, $2, $3, $4, $5)`,
      [assistantMsgId, convId, 'assistant', answer, JSON.stringify({ readiness: context.readinessScore, journey: context.journey ? context.journey.id : null })]
    );

    res.json({
      conversationId: convId,
      answer,
      context: {
        journeyRoute: context.journey ? `${context.journey.from_country} → ${context.journey.to_country}` : null,
        readinessScore: context.readinessScore,
        missingRequirementsCount: context.requirements?.filter(r => r.mandatory && !['UPLOADED', 'VERIFIED'].includes(r.status)).length || 0,
      }
    });
  } catch (err: any) {
    console.error('Assistant error:', err);
    res.status(500).json({ error: 'Failed to process inquiry with MidBridge 2.0 Assistant.' });
  }
}

export async function getConversationHistory(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const convRes = await query(
      `SELECT id FROM assistant_conversations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (convRes.rows.length === 0) {
      res.json({ messages: [] });
      return;
    }

    const convId = convRes.rows[0].id;
    const msgRes = await query(
      `SELECT id, role, content, created_at FROM assistant_messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT 50`,
      [convId]
    );

    res.json({
      conversationId: convId,
      messages: msgRes.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve conversation history.' });
  }
}
