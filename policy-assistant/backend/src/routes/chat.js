import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { queryRag } from '../services/rag.js';

const router = Router();

router.post('/ask', async (req, res) => {
  try {
    const { question, session_id: sessionId, organization_id: organizationId, category } = req.body || {};
    if (!question || typeof question !== 'string') return res.status(400).json({ error: 'question is required' });

    const { answer, citations, documentNames } = await queryRag(question.trim(), {
      organizationId: organizationId || null,
      category: category || null,
    });

    const userId = req.userId || req.headers['x-user-id'] || null;
    let sid = sessionId;
    if (!sid && userId) {
      const { data: newSession } = await supabase
        .from('chat_sessions')
        .insert({ user_id: userId, organization_id: organizationId || null, title: question.slice(0, 80) })
        .select('id')
        .single();
      sid = newSession?.id;
    }
    if (sid) {
      await supabase.from('chat_messages').insert([
        { session_id: sid, role: 'user', content: question },
        { session_id: sid, role: 'assistant', content: answer, citations: citations || [] },
      ]);
    }

    res.json({ answer, citations: citations || [], documentNames: documentNames || [], sessionId: sid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Query failed' });
  }
});

router.get('/sessions', async (req, res) => {
  try {
    const userId = req.userId || req.headers['x-user-id'];
    if (!userId) return res.json([]);
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('id, title, created_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sessions/:id/messages', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, role, content, citations, created_at')
      .eq('session_id', req.params.id)
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
