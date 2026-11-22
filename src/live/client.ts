import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/** One client per page. Only imported when the live flag is on. */
export function supabase() {
  client ??= createClient(import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 10 } },
  });
  return client;
}

/** All writes go through the `submit` Edge Function (validation + rate limits). */
export async function submit(body: Record<string, unknown>) {
  const { data, error } = await supabase().functions.invoke('submit', { body });
  if (error) throw error;
  return data as { ok: boolean; pending?: boolean };
}
