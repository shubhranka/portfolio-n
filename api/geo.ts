// Vercel Edge Function: returns only the visitor's city, for the "Visitor · <city>"
// cursor label. Nothing is logged or stored. Outside Vercel (e.g. `npm run dev`)
// this route doesn't exist and cursors just say "Visitor".
export const config = { runtime: 'edge' };

export default function handler(req: Request) {
  const raw = req.headers.get('x-vercel-ip-city');
  let city = '';
  try {
    city = raw ? decodeURIComponent(raw).slice(0, 40) : '';
  } catch {
    /* malformed header — no city */
  }
  return new Response(JSON.stringify({ city }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store' },
  });
}
