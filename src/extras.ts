/**
 * Content for the playful parts of the site: demos, games, badges and secrets.
 * Same formatting rules as src/data.ts (`code`, *emphasis*, [[placeholder]]).
 */

// ---------------------------------------------------------------------------
// Playable demos on case-study pages
// ---------------------------------------------------------------------------

/** Case studies that have a playable demo, and the label on their home tile. */
export const demoTiles: Record<string, string> = {
  sentinel: 'Try the 10-sec demo',
  'ask-me': 'Hear the call',
};

export const sentinelSim = {
  eyebrow: 'Try it',
  title: 'Sentinel — live mini-sim',
  checking: 15_000,
  fund: 40_000,
  rent: 12_000,
  item: { name: 'Noise-cancelling headphones', price: 29_990 },
  /** Moved from the fund on approval: covers the deficit plus rent. */
  transfer: 27_000,
  lines: {
    idle: 'Watching your cashflow. Try buying the headphones.',
    alert:
      'Heads up: checking is now {checking} and rent of {rent} goes out tomorrow. Move {transfer} from your liquid fund to cover both?',
    done: "Done. Moved {transfer}. Rent is covered and checking is back to {checking}. I'll keep watching.",
    declined: "Okay, nothing moved. Rent will bounce tomorrow unless you top up. I'll remind you tonight at 8.",
  },
  footnote: "The agent proposes; you decide. That's the whole idea.",
};

export interface CallLine {
  who: 'Agent' | 'Caller';
  text: string;
  /** Signal values after this line: mood 0–100, fields collected, watchdog 0–100. */
  mood: number;
  fields: number;
  watch: number;
}

export const askMeReplay = {
  eyebrow: 'Try it',
  title: 'Ask-me — call replay',
  intro: 'A recorded call plays back line by line while the mood gauge reacts.',
  totalFields: 5,
  start: { mood: 70, fields: 0, watch: 0 },
  lines: [
    { who: 'Agent', text: "Hi! This call is recorded. Can I get the account holder's full name?", mood: 64, fields: 1, watch: 0 },
    { who: 'Caller', text: 'I already told the last person all of this.', mood: 44, fields: 1, watch: 40 },
    { who: 'Agent', text: "Sorry about that. Just your name and I'll pull up the rest.", mood: 41, fields: 1, watch: 45 },
    { who: 'Caller', text: 'This is ridiculous. Get me a real person.', mood: 28, fields: 1, watch: 100 },
  ] as CallLine[],
  handoff: 'Handing off to a human · reason: caller asked twice, mood low',
};

// ---------------------------------------------------------------------------
// Highlight-to-explain glossary (case-study pages). Keys are matched without
// case; `also` lists other spellings that should show the same card.
// ---------------------------------------------------------------------------

export const glossaryHint = 'Tip: highlight a technical word for a short explanation.';

export const glossary: { term: string; also?: string[]; text: string }[] = [
  { term: 'snapshot', text: 'A frozen view of the database at one moment. Every query in the transaction sees the data exactly as it was then, even if others write meanwhile.' },
  { term: 'SQLSTATE', also: ['25006', 'SQLSTATE 25006'], text: 'A five-character error code from the SQL standard. 25006 means “read-only SQL transaction”: the database itself refused a write.' },
  { term: 'CTE', also: ['common table expression', 'WITH'], text: 'A named sub-query written with WITH … AS (…). It can contain an UPDATE or DELETE, so a statement that looks like a read can still write.' },
  { term: 'WebRTC', text: 'A browser standard for sending audio, video and data directly between peers in real time, with a server only to help them find each other.' },
  { term: 'minimax', text: 'A game-playing algorithm that tries every move, assumes the opponent always answers with their best move, and picks the move with the best worst case.' },
  { term: 'read-only', also: ['read only', 'BEGIN READ ONLY'], text: 'A transaction mode where Postgres rejects any statement that would change data. Zusk runs every query this way until you flip the switch.' },
  { term: 'transaction', also: ['transactions'], text: 'A group of statements that succeed or fail together. Rolling it back undoes everything inside, as if it never ran.' },
  { term: 'rolled back', also: ['rollback', 'ROLLBACK'], text: 'Ending a transaction by discarding every change it made. Zusk rolls back each run, so even settings like SET don’t linger.' },
  { term: 'auto-commit', also: ['autocommit'], text: 'The default mode where every statement is its own transaction and is saved the moment it finishes.' },
  { term: 'psql', text: 'The official command-line client for PostgreSQL. Its output is the reference for how values should look.' },
  { term: 'dollar quoting', also: ['dollar-quoting'], text: 'A Postgres way to write string literals between $$ … $$ so the text inside can contain quotes freely. Common in function bodies.' },
  { term: 'BEGIN ATOMIC', text: 'A SQL-standard function body that Postgres parses when the function is created. A script splitter has to treat it as one statement.' },
  { term: 'Tauri', text: 'A framework for desktop apps with a Rust core and a web UI rendered by the operating system’s own webview. Apps stay small and fast.' },
  { term: 'webview', text: 'A browser engine embedded in a native app to draw its interface. In Tauri it is sandboxed from the system and talks to Rust through commands.' },
  { term: 'tokio-postgres', also: ['tokio'], text: 'An asynchronous PostgreSQL driver for Rust, built on the Tokio runtime so many queries can wait on the network without blocking threads.' },
  { term: 'TLS', text: 'Transport Layer Security: the encryption that protects data on its way between the app and the database server.' },
  { term: 'keychain', also: ['OS keychain'], text: 'The operating system’s encrypted store for secrets. Passwords saved there are protected by your login, not by the app.' },
  { term: 'function calling', also: ['function-calling', 'function calls', 'tool calls'], text: 'Letting a language model ask for a named function to run with structured arguments. The app decides whether to actually run it.' },
  { term: 'mandate', also: ['mandates'], text: 'A standing instruction to pay a bill automatically, such as rent or a subscription, on a fixed date.' },
  { term: 'WebSocket', also: ['WebSockets'], text: 'A long-lived two-way connection between browser and server, so updates arrive the moment they happen instead of on the next poll.' },
  { term: 'Socket.io', text: 'A Node.js library on top of WebSockets that adds rooms, reconnection and fallbacks.' },
  { term: 'LiveKit', text: 'Open-source infrastructure for real-time audio and video rooms over WebRTC, with an Agents framework for AI participants.' },
  { term: 'Gemini Live', text: 'Google’s realtime voice model API: audio in, audio out, with low enough latency for a phone call.' },
  { term: 'sentiment', also: ['sentiment judge'], text: 'A score for how positive or negative a piece of speech sounds. Here a second model scores each caller turn from −1 to +1.' },
  { term: 'egress', text: 'In LiveKit, exporting a room’s audio or video out of the live session, for example to record a call.' },
  { term: 'Liveblocks', text: 'A hosted service for real-time collaboration: presence, live cursors and shared state that syncs between everyone in a room.' },
  { term: 'Convex', text: 'A hosted backend with a reactive database: queries re-run and push new results to clients whenever the data they read changes.' },
  { term: 'presence', text: 'Live information about who else is here right now — their cursor, selection or status — that disappears when they leave.' },
  { term: 'perfect-freehand', text: 'A small library that turns raw pointer points into a smooth outline whose width follows pressure and speed, like ink.' },
  { term: 'Clerk', text: 'A hosted sign-in and user-management service.' },
  { term: 'PDF.js', also: ['pdf.js'], text: 'Mozilla’s PDF renderer written in JavaScript; it draws each page to a canvas and exposes the text layer for selection.' },
  { term: 'node:sqlite', text: 'The SQLite database built into recent versions of Node.js, so local data needs no extra dependency.' },
  { term: 'RAG', text: 'Retrieval-augmented generation: look up relevant passages first, then give them to the model so its answer is grounded in your text.' },
];
