// Supabase Edge Function: the only way to write guestbook notes and scores.
// Deploy: supabase functions deploy submit
// Secrets: supabase secrets set ALLOWED_ORIGINS="https://your-domain.com,http://localhost:5173"
//
// Checks, in order: origin, shape and length, profanity / links, plausibility
// of scores, a per-visitor rate limit (in memory, keyed by a salted hash of
// the IP that is never stored), and a global hourly cap read from the tables.
import { createClient } from 'npm:@supabase/supabase-js@2.119.0';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const origins = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map((s) => s.trim()).filter(Boolean);

const LIMITS = { name: 24, line: 80, nickname: 20 };
const PER_VISITOR = { windowMs: 10 * 60_000, guestbook: 2, score: 10 };
const GLOBAL_PER_HOUR = { guestbook: 40, score: 300 };

// Keep this short and edit freely; matching is on whole words, case-insensitive.
const BLOCKED = ['fuck', 'shit', 'cunt', 'bitch', 'asshole', 'dick', 'nazi', 'rape', 'porn', 'slut', 'whore', 'fag', 'retard'];
const blockedRe = new RegExp(`\\b(${BLOCKED.join('|')})\\w*\\b`, 'i');
const linkRe = /(https?:\/\/|www\.|\.(com|net|org|io|xyz|ru)\b)/i;

const salt = crypto.randomUUID(); // per instance; rotates whenever the function restarts
const hits = new Map<string, number[]>();

async function visitorKey(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ip));
  return btoa(String.fromCharCode(...new Uint8Array(buf).slice(0, 12)));
}

function allowVisitor(key: string, kind: 'guestbook' | 'score') {
  const now = Date.now();
  const k = `${kind}:${key}`;
  const recent = (hits.get(k) ?? []).filter((t) => now - t < PER_VISITOR.windowMs);
  if (recent.length >= PER_VISITOR[kind]) return false;
  recent.push(now);
  hits.set(k, recent);
  return true;
}

async function underGlobalCap(table: 'guestbook' | 'scores', cap: number) {
  const since = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await db.from(table).select('id', { count: 'exact', head: true }).gte('created_at', since);
  return (count ?? 0) < cap;
}

const clean = (s: unknown, max: number) =>
  typeof s === 'string' ? s.normalize('NFKC').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, max + 1) : '';

function textOk(s: string, max: number) {
  return s.length >= 1 && s.length <= max && !blockedRe.test(s) && !linkRe.test(s);
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') ?? '';
  const cors = {
    'Access-Control-Allow-Origin': origins.includes(origin) ? origin : origins[0] ?? '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, authorization, apikey, x-client-info',
    Vary: 'Origin',
  };
  const reply = (status: number, body: unknown) => Response.json(body, { status, headers: cors });

  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return reply(405, { error: 'method' });
  if (!origins.includes(origin)) return reply(403, { error: 'origin' });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: 'json' });
  }
  const key = await visitorKey(req);

  if (body.kind === 'guestbook') {
    const name = clean(body.name, LIMITS.name);
    const message = clean(body.message, LIMITS.line);
    if (!textOk(name, LIMITS.name) || !textOk(message, LIMITS.line)) return reply(422, { error: 'text' });
    if (!allowVisitor(key, 'guestbook')) return reply(429, { error: 'slow down' });
    if (!(await underGlobalCap('guestbook', GLOBAL_PER_HOUR.guestbook))) return reply(429, { error: 'busy' });
    const { error } = await db.from('guestbook').insert({ name, message });
    return error ? reply(500, { error: 'db' }) : reply(201, { ok: true, pending: true });
  }

  if (body.kind === 'score') {
    const game = body.game;
    const nickname = clean(body.nickname, LIMITS.nickname);
    const value = Number(body.value);
    const accuracy = Number(body.accuracy ?? 100);
    if (!textOk(nickname, LIMITS.nickname) || !Number.isInteger(value)) return reply(422, { error: 'text' });
    // Plausibility: the SQL game has 8 questions; nobody types code at 200+ wpm.
    let label: string;
    if (game === 'sql' && value >= 0 && value <= 8) label = `${value} / 8`;
    else if (game === 'typing' && value >= 1 && value <= 200 && accuracy >= 0 && accuracy <= 100) label = `${value} wpm · ${Math.round(accuracy)}%`;
    else return reply(422, { error: 'score' });
    if (!allowVisitor(key, 'score')) return reply(429, { error: 'slow down' });
    if (!(await underGlobalCap('scores', GLOBAL_PER_HOUR.score))) return reply(429, { error: 'busy' });
    const { error } = await db.from('scores').insert({ game, nickname, value, label });
    return error ? reply(500, { error: 'db' }) : reply(201, { ok: true });
  }

  return reply(400, { error: 'kind' });
});
