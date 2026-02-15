import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { optionalAuth } from './middleware/auth.js';
import documentsRouter from './routes/documents.js';
import chatRouter from './routes/chat.js';

if (!config.supabase.url || !config.supabase.serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}
if (!config.groq.apiKey) {
  console.error('Missing GROQ_API_KEY in environment (required for chat)');
  process.exit(1);
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(optionalAuth);

app.use('/api/documents', documentsRouter);
app.use('/api/chat', chatRouter);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal error' });
});

app.listen(config.port, () => {
  console.log(`Policy Assistant API listening on port ${config.port}`);
});
