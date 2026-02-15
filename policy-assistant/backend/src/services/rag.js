import { supabase } from '../lib/supabase.js';
import { createEmbedding } from '../lib/embeddings.js';
import { createChatCompletion } from '../lib/groq.js';
import { config } from '../config.js';

const SYSTEM_PROMPT = `You are an enterprise policy and compliance assistant. You answer questions ONLY using the provided context from company documents. Do not use external knowledge. If the context does not contain enough information to answer, say so clearly. Always cite the source document name when you use a specific passage. Format citations as [Source: document_name].`;

export async function queryRag(question, options = {}) {
  const { organizationId, category, topK = config.rag.topK, threshold = config.rag.similarityThreshold } = options;

  const [queryEmbedding] = await createEmbedding(question);
  const { data: matches, error } = await supabase.rpc('match_document_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: topK,
    filter_organization_id: organizationId || null,
    filter_category: category || null,
  });

  if (error) throw error;
  if (!matches || matches.length === 0) {
    return {
      answer: "I don't have any company documents loaded that are relevant to this question. Please upload policy or compliance documents first.",
      citations: [],
    };
  }

  const context = matches.map((m) => `[Source: ${m.document_name}]\n${m.content}`).join('\n\n---\n\n');
  const userMessage = `Context from company documents:\n\n${context}\n\nQuestion: ${question}`;

  const answer = await createChatCompletion(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    { temperature: 0.2, maxTokens: 1024 }
  );

  const citations = [...new Set(matches.map((m) => ({ documentName: m.document_name, category: m.category })))];
  const citationRefs = matches.map((m) => ({ documentName: m.document_name, snippet: m.content.slice(0, 200) }));

  return { answer, citations: citationRefs, documentNames: citations.map((c) => c.documentName) };
}
