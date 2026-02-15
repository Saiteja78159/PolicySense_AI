import { supabase } from '../lib/supabase.js';
import { createEmbedding } from '../lib/embeddings.js';
import { splitIntoChunks } from '../lib/chunking.js';
import { extractTextFromBuffer } from '../lib/parsers.js';
import { config } from '../config.js';

const BATCH_EMBED_SIZE = 20;

export async function ingestDocument({ organizationId, name, filePath, fileType, category, uploadedBy, buffer }) {
  const text = await extractTextFromBuffer(buffer, fileType);
  const chunks = splitIntoChunks(text, config.rag.chunkSize, config.rag.chunkOverlap);
  if (chunks.length === 0) throw new Error('No text extracted from document');

  const { data: doc, error: docError } = await supabase
    .from('documents')
    .insert({
      organization_id: organizationId || null,
      name,
      file_path: filePath,
      file_type: fileType,
      category: category || 'general',
      uploaded_by: uploadedBy || null,
    })
    .select('id')
    .single();

  if (docError) throw docError;

  try {
    for (let i = 0; i < chunks.length; i += BATCH_EMBED_SIZE) {
      const batch = chunks.slice(i, i + BATCH_EMBED_SIZE);
      const embeddings = await createEmbedding(batch);
      const rows = batch.map((content, j) => ({
        document_id: doc.id,
        content,
        chunk_index: i + j,
        embedding: Array.isArray(embeddings[j]) ? embeddings[j] : embeddings,
        metadata: {},
      }));
      const { error: chunkError } = await supabase.from('document_chunks').insert(rows);
      if (chunkError) throw chunkError;
    }
  } catch (err) {
    await supabase.from('documents').delete().eq('id', doc.id);
    await supabase.storage.from('policy-documents').remove([filePath]).catch(() => {});
    throw err;
  }

  return { documentId: doc.id, chunkCount: chunks.length };
}
