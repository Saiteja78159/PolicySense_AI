# Enterprise Policy & Compliance Assistant

RAG-powered AI assistant that answers questions **only from company documents** and shows **citations**. Built for HR, legal, compliance, and finance teams. Uses **Groq** (open models) for LLM and embeddings, **Supabase** for auth, storage, and pgvector.

---

## How to run (steps)

### Step 1: Supabase

1. Go to [supabase.com](https://supabase.com) and **create a new project** (sign in if needed).
2. In the project dashboard, open **SQL Editor** → **New query**.
3. Open `policy-assistant/supabase/migrations/20240213000001_init_schema.sql` in your repo, copy **all** its contents, paste into the SQL Editor, and click **Run**.
4. Go to **Settings** → **API**. Copy and keep:
   - **Project URL**
   - **anon** (public) key
   - **service_role** key (keep this secret; backend only)

### Step 2: Groq API key

1. Go to [console.groq.com](https://console.groq.com) and sign in.
2. Create or copy an **API key** (e.g. under API Keys).

### Step 3: Environment variables

From the `policy-assistant` folder:

```bash
cd policy-assistant
cp .env.example .env
```

Edit `.env` and set:

- `SUPABASE_URL` = your Project URL from Step 1  
- `SUPABASE_SERVICE_ROLE_KEY` = your service_role key  
- `VITE_SUPABASE_URL` = same Project URL  
- `VITE_SUPABASE_ANON_KEY` = your anon key  
- `GROQ_API_KEY` = your Groq API key from Step 2  
- `HUGGINGFACE_API_KEY` = optional; only if you set `EMBED_PROVIDER=huggingface`. By default embeddings run locally (open-source, no key).  

### Step 4: Run locally (development)

Backend and frontend read `.env` from their **own** folder when you run them. So copy the root `.env` into each (or create `backend/.env` and `frontend/.env` with the same values).

**Terminal 1 – backend**

```bash
cd policy-assistant/backend
cp ../.env .env    # SUPABASE_*, GROQ_API_KEY (HUGGINGFACE_API_KEY only if using EMBED_PROVIDER=huggingface)
npm install
npm run dev
```

You should see: `Policy Assistant API listening on port 5000`. Leave this running.

**Terminal 2 – frontend**

```bash
cd policy-assistant/frontend
cp ../.env .env    # or create .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

### Step 5: Create a user and use the app

1. In Supabase dashboard: **Authentication** → **Users** → **Add user** → create a user with email and password (or use **Sign up** on the app’s Register page).
2. In the app: **Sign in** (or **Register**), then:
   - **Documents**: upload a PDF/DOCX/TXT (e.g. a policy), pick a category (HR, Legal, etc.).
   - **Ask**: type a question; the answer will use only your documents and show **citations**.

### Run with Docker (production-style)

From `policy-assistant` (with `.env` already filled as in Step 3):

```bash
cd policy-assistant
docker compose build
docker compose up -d
```

- App: **http://localhost:3000**  
- Backend: **http://localhost:5000**  

To stop: `docker compose down`.

---

## Features

- **Document upload**: PDF, DOCX, TXT. Categorize as HR, Legal, Compliance, Finance.
- **RAG pipeline**: Chunk → embed (Groq `nomic-embed-text-v1.5`) → store in Supabase pgvector.
- **Ask with citations**: Query returns an answer plus source documents and snippets.
- **Auth**: Supabase Auth (email/password).
- **Docker**: Production-ready `docker-compose` (backend + frontend).

## Prerequisites

- Node 20+
- [Supabase](https://supabase.com) project
- [Groq](https://console.groq.com) API key (for chat/LLM)
- **Embeddings:** open-source by default (local via [Transformers.js](https://github.com/xenova/transformers.js), no API key). Optional: `HUGGINGFACE_API_KEY` or `EMBED_PROVIDER=huggingface` for API-based embeddings.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run the migration:
   - Copy contents of `supabase/migrations/20240213000001_init_schema.sql`
   - Execute (enables pgvector, tables, RPC `match_document_chunks`, storage bucket).
3. In **Settings → API**: copy **Project URL**, **anon key**, and **service_role key**.
4. **Optional (no email confirmation):** To sign in right after registering without confirming email, go to **Authentication** → **Providers** → **Email** and turn **off** "Confirm email".

## Local development

```bash
# Backend
cd policy-assistant/backend
cp ../.env.example .env   # fill SUPABASE_*, GROQ_API_KEY, HUGGINGFACE_API_KEY
npm install
npm run dev               # http://localhost:5000

# Frontend (new terminal)
cd policy-assistant/frontend
cp ../.env.example .env   # set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev               # http://localhost:3000 (proxies /api to backend)
```

Create a user in Supabase (Authentication → Users → Add user) and sign in.

## Docker (production)

```bash
cd policy-assistant
cp .env.example .env      # fill all variables
docker compose build
docker compose up -d
```

- Frontend: http://localhost:3000  
- Backend API: http://localhost:5000  

Frontend container proxies `/api` to the backend.

## Environment variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (backend only) |
| `VITE_SUPABASE_URL` | Same URL (frontend build) |
| `VITE_SUPABASE_ANON_KEY` | Anon key (frontend build) |
| `GROQ_API_KEY` | Groq API key (for chat) |
| `EMBED_PROVIDER` | Optional: `local` (default, open-source Transformers.js), `huggingface`, or `groq` |
| `HUGGINGFACE_API_KEY` | Only if `EMBED_PROVIDER=huggingface`; get at [hf.co/settings/tokens](https://huggingface.co/settings/tokens) |
| `GROQ_CHAT_MODEL` | Optional, default `llama-3.3-70b-versatile` |
| `RAG_TOP_K` | Optional, chunks per query (default 6) |
| `RAG_SIMILARITY_THRESHOLD` | Optional (default 0.4) |

## Project structure

```
policy-assistant/
├── backend/           # Node, Express, RAG + Groq
│   ├── src/
│   │   ├── lib/       # supabase, groq, chunking, parsers
│   │   ├── services/  # ingest, rag
│   │   ├── routes/    # documents, chat
│   │   └── index.js
│   └── Dockerfile
├── frontend/          # React, Vite, Tailwind, Supabase Auth
│   ├── src/
│   │   ├── components/
│   │   ├── lib/       # supabase, auth, api
│   │   └── pages/     # Login, Dashboard, Documents
│   └── Dockerfile
├── supabase/migrations/
├── docker-compose.yml
├── .env.example
└── README.md
```

## Alternative embeddings

If Groq does not offer embeddings in your region, you can switch to another OpenAI-compatible embeddings API (e.g. [Hugging Face Inference](https://huggingface.co/inference-api), [Nomic](https://docs.nomic.ai/reference/endpoints/nomic-embed-text), or [OpenAI](https://platform.openai.com/docs/guides/embeddings)) by changing `backend/src/lib/groq.js` `createEmbedding` to call that endpoint and ensuring the embedding dimension matches (768 for nomic-embed-text-v1.5; update the migration if you use a different dimension).

## License

MIT
