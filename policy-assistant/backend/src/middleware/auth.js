import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

const supabaseAuth = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Optional: verify JWT and set req.userId. If no/invalid token, req.userId stays undefined (still allow for public-ish API if needed). */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    req.userId = req.headers['x-user-id'] || null;
    return next();
  }
  try {
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
    if (!error && user) req.userId = user.id;
    else req.userId = req.headers['x-user-id'] || null;
  } catch {
    req.userId = req.headers['x-user-id'] || null;
  }
  next();
}
