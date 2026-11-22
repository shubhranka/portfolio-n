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

// ---------------------------------------------------------------------------
// /play page
// ---------------------------------------------------------------------------

export const playPage = {
  eyebrow: 'Play',
  title: 'Take a break. *Lose to my code.*',
  sql: {
    title: 'Would Zusk run this?',
    intro: 'Read-only mode is on. Allow the statement or block it before it reaches the database.',
    keys: 'keys: A allow · B block · N next',
    perfect: 'Perfect run. You think like a Postgres engine.',
    good: 'Good run. Check the misses, then go for a perfect score.',
  },
  ttt: {
    title: 'Beat my AI',
    intro: 'You’re X. It plays minimax, so the best you can do is a draw — and a draw earns the “Worthy opponent” badge.',
    status: {
      turn: 'Your move.',
      thinking: 'Thinking…',
      x: 'You won? That should be impossible.',
      o: 'The AI wins this one.',
      draw: 'Draw — a worthy opponent.',
    },
  },
  typing: {
    title: 'Code typing race',
    note: 'snippet from',
    intro: 'Type the snippet exactly. The clock starts on your first key.',
  },
  blob: {
    title: 'Blob playground',
    intro: 'Poke it. Poke too fast and it gets annoyed, then slowly calms back down. It’s the same 3D blob as on the home page.',
    calm: 'Let it calm down',
    moods: { calm: 'Calm', wobbly: 'Wobbly', annoyed: 'Annoyed' },
  },
  board: {
    title: 'Leaderboard',
    localNote: 'Your personal bests, saved in this browser.',
    empty: 'No scores yet. Play a round to set one.',
  },
};

export interface SqlQuestion {
  sql: string;
  /** true = Zusk lets it through in read-only mode */
  ok: boolean;
  why: string;
}

/** "Would Zusk run this?" — add a question by adding an entry. */
export const sqlQuestions: SqlQuestion[] = [
  { sql: 'SELECT * FROM orders\nORDER BY placed_at DESC\nLIMIT 100;', ok: true, why: 'Plain reads are exactly what read-only mode is for.' },
  { sql: 'DELETE FROM sessions\nWHERE expires_at < now();', ok: false, why: 'Postgres itself rejects the write with SQLSTATE 25006, because the run is inside BEGIN READ ONLY.' },
  { sql: 'COMMIT;', ok: false, why: 'Zusk refuses statements that would end the read-only transaction early, before anything is sent.' },
  { sql: "WITH upgraded AS (\n  UPDATE users SET plan = 'pro'\n  RETURNING id\n)\nSELECT * FROM upgraded;", ok: false, why: 'A write hidden inside a CTE is still a write, and the database blocks it.' },
  { sql: "SELECT nextval('order_id_seq');", ok: false, why: 'Tricky one: nextval() changes the sequence, so it is not allowed in a read-only transaction.' },
  { sql: "SET work_mem = '64MB';", ok: true, why: 'SET is allowed, but in read-only mode it does not carry over, because every run is rolled back.' },
  { sql: 'CREATE TEMP TABLE scratch AS\nSELECT 1;', ok: false, why: 'Every CREATE is disallowed in a read-only transaction, temporary tables included.' },
  { sql: 'EXPLAIN SELECT * FROM invoices\nWHERE total > 500;', ok: true, why: 'EXPLAIN without ANALYZE only plans the query, so nothing changes.' },
];

/** Typing race snippets — real lines from the repos. Keep them short (one to three lines). */
export const typingSnippets: { repo: string; code: string }[] = [
  { repo: 'zusk', code: 'if read_only && editor.tx != TxState::Idle {\n    editor.client.batch_execute("ROLLBACK").await?;\n}' },
  { repo: 'sentinel', code: 'const deficit = totalBills - userState.balances.checking;' },
  { repo: 'smart-pdf-reader', code: "const words = selection.trim().split(/\\s+/).filter(Boolean);\nif (words.length === 1) return 'word';" },
  { repo: 'ask-me', code: 'return sum(1 for r in self.recent if r.score <= self.config.negative_below)' },
  { repo: 'zusk', code: 'client.batch_execute(&format!("SET default_transaction_read_only = {value}")).await?;' },
];

// ---------------------------------------------------------------------------
// Badges — `how` is shown on the toast and the shelf.
// ---------------------------------------------------------------------------

export const badges = [
  { id: 'terminal', icon: '>_', name: 'Found the terminal', how: 'Pressed ~' },
  { id: 'night-owl', icon: '☾', name: 'Night owl', how: 'Visited between midnight and 5 am' },
  { id: 'worthy', icon: '#', name: 'Worthy opponent', how: 'Drew with the minimax AI' },
  { id: 'read-only', icon: '⛁', name: 'Read-only mind', how: 'Perfect score in “Would Zusk run this?”' },
  { id: 'reader', icon: '≡', name: 'Read every case study', how: 'All five, start to finish' },
  { id: 'blob', icon: '●', name: 'Blob whisperer', how: 'Annoyed the blob, then let it calm down' },
  { id: 'typist', icon: '⌨', name: 'Speed typist', how: '60+ wpm at 95%+ accuracy' },
  { id: 'retro', icon: '▚', name: 'Retro soul', how: 'Entered the Konami code' },
  { id: 'stones', icon: '◆', name: 'Stone collector', how: 'Found all five stones' },
] as const;

export type BadgeId = (typeof badges)[number]['id'];

/** Typing race result needed for the "Speed typist" badge. */
export const typistBar = { wpm: 60, accuracy: 95 };

// ---------------------------------------------------------------------------
// Hidden stones. `where` is only revealed once that stone is found.
// ---------------------------------------------------------------------------

export const stones = [
  { id: 'footer', where: 'In the footer, beside the copyright line' },
  { id: 'snake', where: 'Every 5th food in terminal Snake' },
  { id: 'sphere', where: 'One tag on the spinning toolbox sphere' },
  { id: 'zusk', where: 'Highlight the last word of the Zusk case study' },
  { id: 'sql', where: 'Perfect score in “Would Zusk run this?”' },
] as const;

export type StoneId = (typeof stones)[number]['id'];

/** The sphere tag that hides a stone (must be in `sphereTags` in data.ts). */
export const stoneTag = 'Three.js';

export const secretsCopy = {
  counterLabel: 'Stones found',
  shelfTitle: 'Your progress',
  stonesTitle: 'Stones',
  badgesTitle: 'Badges',
  hidden: 'Still hidden',
  unlocked: 'All five found — the secret page is open.',
  openSecret: 'Open the secret page →',
  reset: 'Reset progress',
  resetConfirm: 'This forgets stones, badges and scores in this browser. Reset?',
  resetDone: 'Progress reset.',
  stoneToast: 'Stone found',
  badgeToast: 'Badge unlocked',
  crtHint: 'CRT mode · press Esc to return to 2026',
};

/** /secret — shown once all five stones are found. */
export const secretNote = {
  eyebrow: '5 / 5 · secret page unlocked',
  title: 'You’re thorough. *I like that.*',
  body: [
    'Most people scroll past. You found all five stones, which is the same attention to detail I try to put into the things I build. If you’re hiring, or just want to talk about calm software, write to me and mention the stones.',
    '[[TODO: rewrite this note in your own voice.]]',
  ],
  locked: 'Not yet. You’ve found {n} of 5 stones — keep looking.',
  lockedHint: 'Hint: one hides in the footer of every page.',
};
