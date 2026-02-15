const API = '/api';

async function getHeaders() {
  const { supabase } = await import('./supabase.js');
  const { data: { session } } = await supabase.auth.getSession();
  const headers = { 'Content-Type': 'application/json' };
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
  if (session?.user?.id) headers['X-User-Id'] = session.user.id;
  return headers;
}

export async function uploadDocument(file, category = 'general', name) {
  const headers = await getHeaders();
  delete headers['Content-Type'];
  const form = new FormData();
  form.append('file', file);
  form.append('category', category);
  if (name) form.append('name', name);
  const res = await fetch(`${API}/documents/upload`, { method: 'POST', headers, body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export async function listDocuments() {
  const res = await fetch(`${API}/documents`, { headers: await getHeaders() });
  if (!res.ok) throw new Error('Failed to load documents');
  return res.json();
}

export async function deleteDocument(id) {
  const res = await fetch(`${API}/documents/${id}`, { method: 'DELETE', headers: await getHeaders() });
  if (!res.ok) throw new Error('Failed to delete');
  return res.json();
}

export async function askQuestion(question, sessionId = null, category = null) {
  const res = await fetch(`${API}/chat/ask`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ question, session_id: sessionId, category }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Query failed');
  }
  return res.json();
}

export async function getChatSessions() {
  const res = await fetch(`${API}/chat/sessions`, { headers: await getHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export async function getSessionMessages(sessionId) {
  const res = await fetch(`${API}/chat/sessions/${sessionId}/messages`, { headers: await getHeaders() });
  if (!res.ok) return [];
  return res.json();
}
