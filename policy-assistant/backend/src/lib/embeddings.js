/**
 * Embeddings: local (default, open-source via Transformers.js), Hugging Face API, or Groq.
 * Local = Xenova/jina-embeddings-v2-base-en, 768d, no API key.
 */
import { config } from '../config.js';

const EMBED_DIM = 768;
const LOCAL_MODEL = 'Xenova/jina-embeddings-v2-base-en';

let localPipeline = null;

async function getLocalPipeline() {
  if (localPipeline) return localPipeline;
  const { pipeline } = await import('@xenova/transformers');
  localPipeline = await pipeline('feature-extraction', LOCAL_MODEL, { pooling: 'mean' });
  return localPipeline;
}

async function embedWithLocal(texts) {
  const extractor = await getLocalPipeline();
  const results = [];
  for (const text of texts) {
    const output = await extractor(text, { pooling: 'mean' });
    const vec = output?.data ? Array.from(output.data) : Array.isArray(output) ? output : [];
    if (!vec.length) throw new Error('Local embedding returned empty');
    results.push(vec.length >= EMBED_DIM ? vec.slice(0, EMBED_DIM) : vec);
  }
  return results;
}

function meanPool(tokens) {
  const dim = tokens[0].length;
  const out = new Array(dim).fill(0);
  for (const t of tokens) for (let i = 0; i < dim; i++) out[i] += t[i];
  for (let i = 0; i < dim; i++) out[i] /= tokens.length;
  return out.slice(0, EMBED_DIM);
}

async function embedWithHuggingFace(texts) {
  const apiKey = config.embeddings.huggingface.apiKey;
  if (!apiKey) {
    throw new Error(
      'HUGGINGFACE_API_KEY is required for embeddings. Get a free token at https://huggingface.co/settings/tokens'
    );
  }
  const model = config.embeddings.huggingface.model;
  const results = [];
  for (const text of texts) {
    const res = await fetch(
      `https://api-inference.huggingface.co/pipeline/feature-extraction/${model}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Hugging Face embeddings failed: ${res.status} ${err}`);
    }
    const raw = await res.json();
    let vec = Array.isArray(raw) ? raw : raw?.data ?? raw?.embedding ?? raw;
    if (!Array.isArray(vec) || vec.length === 0) throw new Error('Invalid embedding response');
    if (Array.isArray(vec[0]) && typeof vec[0][0] === 'number') {
      vec = vec[0].length === EMBED_DIM ? vec[0] : meanPool(vec);
    }
    const normalized = vec.length >= EMBED_DIM ? vec.slice(0, EMBED_DIM) : vec;
    results.push(normalized);
  }
  return results;
}

async function embedWithGroq(texts) {
  const response = await fetch('https://api.groq.com/openai/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.groq.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.groq.embedModel,
      input: texts,
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq embeddings failed: ${response.status} ${err}`);
  }
  const data = await response.json();
  const list = data.data;
  if (!list || list.length === 0) throw new Error('No embedding returned from Groq');
  return list.length === 1 ? [list[0].embedding] : list.map((d) => d.embedding);
}

export async function createEmbedding(input) {
  const texts = Array.isArray(input) ? input : [input];
  const provider = (config.embeddings?.provider || 'local').toLowerCase();

  if (provider === 'local') {
    return embedWithLocal(texts);
  }
  if (provider === 'groq') {
    return embedWithGroq(texts);
  }
  try {
    return await embedWithHuggingFace(texts);
  } catch (err) {
    if (provider === 'huggingface') throw err;
    return embedWithGroq(texts);
  }
}
