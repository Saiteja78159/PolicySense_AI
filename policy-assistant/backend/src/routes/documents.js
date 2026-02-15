import { Router } from 'express';
import multer from 'multer';
import { supabase } from '../lib/supabase.js';
import { ingestDocument } from '../services/ingest.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB
const router = Router();

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/markdown',
];

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (!ALLOWED_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: `Unsupported file type: ${req.file.mimetype}. Use PDF, DOCX, or TXT.` });
    }
    const category = (req.body.category || 'general').toLowerCase();
    if (!['hr', 'legal', 'compliance', 'finance', 'general'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    const organizationId = req.body.organization_id || null;
    const userId = req.userId || req.headers['x-user-id'] || null;

    const name = req.body.name || req.file.originalname || 'Untitled';
    const filePath = `${organizationId || 'default'}/${Date.now()}-${req.file.originalname || 'file'}`;

    const { data: storageData, error: storageError } = await supabase.storage
      .from('policy-documents')
      .upload(filePath, req.file.buffer, { contentType: req.file.mimetype, upsert: false });

    if (storageError) return res.status(500).json({ error: 'Storage upload failed', detail: storageError.message });

    const result = await ingestDocument({
      organizationId,
      name,
      filePath: storageData.path,
      fileType: req.file.mimetype,
      category,
      uploadedBy: userId,
      buffer: req.file.buffer,
    });

    res.json({ documentId: result.documentId, chunkCount: result.chunkCount, name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Ingestion failed' });
  }
});

router.get('/', async (req, res) => {
  try {
    const organizationId = req.query.organization_id || null;
    let q = supabase.from('documents').select('id, name, file_type, category, created_at').order('created_at', { ascending: false });
    if (organizationId) q = q.eq('organization_id', organizationId);
    const { data, error } = await q;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { data: doc } = await supabase.from('documents').select('file_path').eq('id', req.params.id).single();
    if (doc?.file_path) await supabase.storage.from('policy-documents').remove([doc.file_path]);
    const { error } = await supabase.from('documents').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
