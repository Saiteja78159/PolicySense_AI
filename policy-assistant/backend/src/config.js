import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    chatModel: process.env.GROQ_CHAT_MODEL || 'llama-3.3-70b-versatile',
    embedModel: process.env.GROQ_EMBED_MODEL || 'nomic-embed-text-v1.5',
  },
  embeddings: {
    provider: process.env.EMBED_PROVIDER || 'local',
    huggingface: {
      apiKey: process.env.HUGGINGFACE_API_KEY,
      model: process.env.HUGGINGFACE_EMBED_MODEL || 'BAAI/bge-base-en-v1.5',
    },
  },
  rag: {
    chunkSize: parseInt(process.env.RAG_CHUNK_SIZE || '800', 10),
    chunkOverlap: parseInt(process.env.RAG_CHUNK_OVERLAP || '100', 10),
    topK: parseInt(process.env.RAG_TOP_K || '6', 10),
    similarityThreshold: parseFloat(process.env.RAG_SIMILARITY_THRESHOLD || '0.4'),
  },
};
