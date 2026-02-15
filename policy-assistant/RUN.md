# How to run Policy & Compliance Assistant

## 1. One-time setup

Make sure you have:

- **Supabase** project created and migration run (see README).
- **`.env`** in `policy-assistant/` with at least:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `GROQ_API_KEY`

Embeddings use **local** (no key) by default. No `HUGGINGFACE_API_KEY` needed unless you set `EMBED_PROVIDER=huggingface`.

---

## 2. Run the app (two terminals)

### Terminal 1 – Backend

```bash
cd policy-assistant/backend
cp ../.env .env   # if you haven’t already
npm install
npm start
```

You should see: **Policy Assistant API listening on port 5000**

If you see **EADDRINUSE** (port in use), either:

- Stop whatever is using port 5000, or  
- Use another port: `PORT=5001 npm start`  
  (then in frontend `.env` you’d need the API base URL if you change it later)

### Terminal 2 – Frontend

```bash
cd policy-assistant/frontend
cp ../.env .env   # if you haven’t already
npm install
npm run dev
```

Then open: **http://localhost:3000**

---

## 3. Use the app

1. **Sign in** or **Register** (Supabase Auth).
2. **Documents** → Upload a PDF/DOCX/TXT, choose category.
3. **Ask** → Ask a question; answers use only your documents and show citations.

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| `Policy Assistant API listening on port 5000` never appears | Check `.env` in `backend/` has `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`. |
| Port 5000 already in use | Run `PORT=5001 npm start` in backend. Frontend proxies `/api` to the same host; if backend is on 5001 you must set the proxy in `frontend/vite.config.js` to `http://localhost:5001`. |
| `EMFILE: too many open files` when using `npm run dev` | Use `npm start` instead of `npm run dev` (no file watching). |
| Frontend shows “Invalid API key” or auth errors | Ensure `frontend/.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then restart the frontend (`npm run dev`). |
