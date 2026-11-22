/**
 * Every piece of content on the site lives in this file.
 *
 * Text formatting (see `fmt` in src/lib/dom.ts):
 *   `code`        → monospace
 *   *emphasis*    → italic, accent colour in headings
 *   [[note]]      → a visibly marked PLACEHOLDER. Search for "[[" to find
 *                   everything that still needs your real details.
 *
 * Anything with `placeholder: true` is also shown with a dashed outline.
 */

export interface Link {
  label: string;
  href: string;
  placeholder?: boolean;
}

export interface Shot {
  src?: string; // omit to render a marked placeholder frame
  alt: string;
  caption?: string;
}

export interface ArchNode {
  name: string;
  note?: string;
  tone?: 'accent' | 'store' | 'dashed';
}

export interface Architecture {
  label: string; // accessible description of the whole diagram
  columns: ArchNode[][];
  edges: string[]; // label for the connector after each column but the last
}

export interface CaseStudy {
  eyebrow: string;
  tagline: string;
  facts: { label: string; value: string; links?: Link[] }[];
  hero?: Shot; // omit to show no hero image at all
  problem: { title: string; body: string };
  decisions: { title: string; body: string }[];
  architecture: Architecture;
  highlight?: {
    eyebrow: string;
    title: string;
    body: string;
    shot?: Shot;
    code?: string;
    steps?: string[];
  };
  gallery: Shot[];
  learned: string[];
}

export type TileVisual = 'zusk' | 'pdf' | 'voice' | 'sentinel' | 'chalky';

export interface Project {
  slug: string;
  name: string;
  kind: string;
  blurb: string;
  stack: string[];
  repo: string;
  live?: string;
  /** one line for the ~ terminal */
  oneLiner: string;
  visual?: TileVisual;
  caseStudy?: CaseStudy;
}

const GH = 'https://github.com/shubhranka';

// ---------------------------------------------------------------------------
// About you
// ---------------------------------------------------------------------------

export const profile = {
  name: 'Shubhranka Varma',
  initials: 'SV', // [[shown in place of a photo. Drop a photo at public/me.jpg and set `photo`]]
  photo: '' as string, // e.g. '/me.jpg'
  role: 'Software Engineer',
  meta: '5 yrs · India',
  openToWork: true,
  headline: 'I build *calm* software dev tools, AI agents & real-time apps.',
  intro:
    'Five years of shipping across Rust, TypeScript, Python and Flutter. I like quiet interfaces, fast feedback loops and software that asks before it acts.',
  about:
    'Software engineer from India with five years of shipping products end to end: desktop dev tools in Rust, AI agents that know when to step aside, and real-time apps over WebRTC and WebSockets. I care about software that feels calm: fast, honest about what it is doing, and safe by default. [[Add a sentence about what you want to work on next.]]',
  email: 'shubhrankavarma@gmail.com',
  github: GH,
  linkedin: { label: 'LinkedIn', href: 'https://www.linkedin.com/in/shubhranka-varma/' } as Link,
  resume: { label: 'Résumé', href: '/resume.pdf', placeholder: true } as Link, // [[put your résumé at public/resume.pdf]]
  repoCount: '60+',
};

export const toolbox: { group: string; items: string[] }[] = [
  { group: 'Languages', items: ['TypeScript', 'Rust', 'Python', 'Dart', 'Java'] },
  { group: 'Frontend & mobile', items: ['React', 'Next.js', 'Flutter', 'React Native', 'Tauri'] },
  { group: 'Backend & data', items: ['Node.js', 'Express', 'PostgreSQL', 'Prisma', 'Supabase', 'SQLite'] },
  { group: 'Real-time & AI', items: ['WebRTC', 'Socket.io', 'LiveKit', 'Liveblocks', 'Gemini', 'Groq'] },
];

/** Names on the rotating 3D tag sphere. */
export const sphereTags = [
  'Rust', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Python', 'Flutter', 'React Native', 'Tauri',
  'PostgreSQL', 'Supabase', 'WebRTC', 'LiveKit', 'Socket.io', 'Prisma', 'Gemini', 'Java', 'SQLite',
  'Three.js', 'Convex', 'Express', 'Dart',
];

export const lab: { glyph: string; name: string; desc: string; href: string }[] = [
  { glyph: '∿', name: 'Creative coding', desc: 'Generative sketches and small visual toys.', href: `${GH}/creative_coding` },
  { glyph: '>_', name: 'Terminal portfolio', desc: 'The ~ terminal you can open on this site.', href: `${GH}/terminal_portfolio` },
  { glyph: '✎', name: 'Drawing app', desc: 'A canvas drawing app with its own backend.', href: `${GH}/simple_drawing_app` },
  { glyph: '⇄', name: 'P2P file sharing', desc: 'Peer-to-peer file transfer, written in Java.', href: `${GH}/p2p_file_sharing` },
];

// ---------------------------------------------------------------------------
// Projects. The first five have case studies, in this order.
// ---------------------------------------------------------------------------

export const projects: Project[] = [
  {
    slug: 'zusk',
    name: 'Zusk',
    kind: 'Desktop app · Featured',
    blurb: 'A calm, fast desktop client for PostgreSQL. Read-only until you say otherwise.',
    stack: ['Rust', 'Tauri 2', 'React 19', 'PostgreSQL'],
    repo: `${GH}/zusk`,
    oneLiner: 'calm PostgreSQL client · Rust, Tauri',
    visual: 'zusk',
    caseStudy: {
      eyebrow: 'Desktop app · Rust + Tauri',
      tagline: 'A calm, fast desktop client for PostgreSQL. *Read-only until you say otherwise.*',
      facts: [
        { label: 'Role', value: 'Solo · design & build' },
        { label: 'Stack', value: 'Rust · Tauri 2 · React 19' },
        { label: 'Platforms', value: 'macOS · Windows · Linux' },
        {
          label: 'Links',
          value: '',
          links: [
            { label: 'Download', href: `${GH}/zusk/releases` },
            { label: 'Source', href: `${GH}/zusk` },
          ],
        },
      ],
      hero: {
        src: '/work/zusk/hero.png',
        alt: 'Zusk main window: explorer tree, SQL editor with a read-only switch, and a typed results grid',
      },
      problem: {
        title: "One wrong run shouldn't cost a table.",
        body: 'Database GUIs make it just as easy to run an `UPDATE` as a `SELECT`. I wanted a client for exploring production-like data that is safe by default, shows values exactly as `psql` would, and stays out of the way: browse a schema, preview a table in one click, and write SQL in an editor that knows your tables.',
      },
      decisions: [
        {
          title: 'Read-only, enforced by the server',
          body: 'Not hidden buttons. Every run happens in a read-only transaction that is rolled back, so Postgres itself refuses writes. Making changes is an explicit switch.',
        },
        {
          title: 'The webview never touches the DB',
          body: 'The React UI calls a small set of typed Tauri commands. A Rust core does the rest with `tokio-postgres` and native TLS; passwords live in the OS keychain.',
        },
        {
          title: 'AI that asks before it acts',
          body: 'Fix with AI and Chat rewrite your SQL with a diff and undo. Nothing runs until you run it. The agent is always read-only, on its own connection, with a 30-second timeout.',
        },
      ],
      architecture: {
        label:
          'Architecture: the React UI calls the Rust core through Tauri commands; the core uses a catalog connection and an editor connection to PostgreSQL, and stores secrets in the OS keychain',
        columns: [
          [{ name: 'React UI', note: 'webview' }],
          [{ name: 'Rust core', note: 'tokio-postgres · TLS', tone: 'accent' }],
          [
            { name: 'Catalog connection', note: 'explorer' },
            { name: 'Editor connection', note: 'your session' },
            { name: 'OS keychain', note: 'secrets', tone: 'dashed' },
          ],
          [{ name: 'PostgreSQL', tone: 'store' }],
        ],
        edges: ['Tauri commands', '', ''],
      },
      highlight: {
        eyebrow: 'Safety, visible',
        title: 'Writes fail at the database, with SQLSTATE 25006.',
        body: "Flip the Read-only switch to make changes. The status bar always shows whether you're in auto-commit, an open transaction or an aborted one.",
        shot: { src: '/work/zusk/read-only.png', alt: 'A DELETE statement refused by the server because the session is read-only' },
      },
      gallery: [
        { src: '/work/zusk/query.png', alt: 'A query joining orders and customers, with revenue by country in the grid', caption: 'Write and run SQL with autocompletion, typed columns and timings.' },
        { src: '/work/zusk/structure.png', alt: 'The Structure tab for orders: columns, types, nullability, keys and defaults', caption: 'Read the structure: types, keys, defaults and comments.' },
        { src: '/work/zusk/jump.png', alt: 'The jump box listing tables and views from several schemas', caption: 'Jump anywhere with ⌘K, across schemas.' },
      ],
      learned: [
        'Being *faithful to psql* is a feature in itself. Scripts are split and run one statement at a time, and the splitter has to handle quoted identifiers, dollar quoting, nested comments and `BEGIN ATOMIC` bodies. The edge cases are the product.',
        'Two connections per server beat one. The catalog connection keeps the explorer responsive while your editor session keeps its `SET`s, open transactions and temp tables between runs.',
        'Column types can be filled in after the fact by preparing a statement without running it again, so results stay exact without paying for a second execution.',
        '[[Draft written from the README. Rewrite these in your own words.]]',
      ],
    },
  },
  {
    slug: 'smart-pdf-reader',
    name: 'Smart PDF Reader',
    kind: 'AI · Reading',
    blurb: 'Remembers where you stopped and explains anything you highlight.',
    stack: ['Node.js', 'Express', 'PDF.js', 'SQLite', 'Gemini'],
    repo: `${GH}/smart-pdf-reader`,
    oneLiner: 'explains what you highlight · Node, AI',
    visual: 'pdf',
    caseStudy: {
      eyebrow: 'AI · Reading · Runs locally',
      tagline: 'A calm little PDF reader that remembers where you stopped *and explains anything you highlight.*',
      facts: [
        { label: 'Role', value: 'Solo · design & build' },
        { label: 'Stack', value: 'Express · PDF.js · node:sqlite' },
        { label: 'AI', value: 'Gemini · Mistral · Groq · OpenRouter · NVIDIA' },
        { label: 'Links', value: '', links: [{ label: 'Source', href: `${GH}/smart-pdf-reader` }] },
      ],
      hero: {
        src: '/work/smart-pdf-reader/explain-light.png',
        alt: "Highlighting 'Oxidative Phosphorylation' opens a panel with its meaning, a labelled diagram of a mitochondrion and what it means in this document",
      },
      problem: {
        title: "Reading something hard shouldn't mean leaving the page.",
        body: 'Looking up a word means a new tab, a search and a lost place. Coming back after a week means rereading the last chapter. I wanted a reader where help comes to the page (the meaning of a word *and* what it means in this book) and where nothing leaves your machine except the text you ask about.',
      },
      decisions: [
        {
          title: 'Explain in context, not just define',
          body: 'Every lookup returns a plain meaning plus what it means *here*, worked out from the surrounding page. Concrete things get a picture from Wikipedia, Commons or Openverse; abstract words get none, on purpose.',
        },
        {
          title: 'Private by default',
          body: 'PDFs, reading positions, lookups and ink stay in local folders and `node:sqlite`. The model only sees the text you highlight; images are fetched by the server so image sites never see what you read; the voice runs on-device.',
        },
        {
          title: 'Cache everything worth caching',
          body: 'The same lookup twice is instant and free. Long books are recapped in pieces that are reused as you read further, so later recaps cost less than earlier ones.',
        },
      ],
      architecture: {
        label:
          'Architecture: the browser renders PDFs with PDF.js and talks to a plain Express server, which calls your chosen AI provider, fetches images, and stores everything in SQLite',
        columns: [
          [
            { name: 'Browser', note: 'plain JS · PDF.js · rough.js' },
            { name: 'Kokoro voice', note: 'on-device TTS', tone: 'dashed' },
          ],
          [{ name: 'Express server', note: 'no build step', tone: 'accent' }],
          [
            { name: 'AI provider', note: 'Gemini · Groq · …' },
            { name: 'Image sources', note: 'Wikipedia · Openverse' },
          ],
          [{ name: 'SQLite', note: 'positions · lookups · ink', tone: 'store' }],
        ],
        edges: ['REST', '', ''],
      },
      highlight: {
        eyebrow: 'Catch me up',
        title: 'A recap of everything so far, with a sketch of how it connects.',
        body: 'Choose a range (from the start, up to any page, or up to a line you highlight) and get a short summary with key points linked to their pages, plus a hand-drawn diagram. Recaps are saved, so “what I knew at page 40” is one click away.',
        shot: { src: '/work/smart-pdf-reader/recap-diagram.png', alt: "The recap's hand-drawn diagram: electrons from food, electron transport chain, proton gradient, ATP synthase, ATP" },
      },
      gallery: [
        { src: '/work/smart-pdf-reader/library.png', alt: "The library: a drop zone for PDFs and a list of books, each showing a 'Resume p.17' link", caption: 'Picks up where you left off, per book.' },
        { src: '/work/smart-pdf-reader/select.png', alt: "A selected heading with buttons for 'What does this mean?' and 'Recap up to here'", caption: 'Highlight to understand.' },
        { src: '/work/smart-pdf-reader/dark-pages.png', alt: 'PDF pages rendered dark with light text', caption: 'Even the pages go dark at night.' },
      ],
      learned: [
        'Let the model *decide* the structure, never draw it. Diagrams and mind maps are sketched by rough.js from what the model returns, so they always look the same and never come out mangled.',
        'Lazy rendering is what makes a 900-page PDF open as fast as a 5-page one: pages are drawn only as you reach them.',
        'Keeping a highlight in time with a voice that never says where it is turned out to be the hardest small problem in the app.',
        '[[Draft written from the README. Rewrite these in your own words.]]',
      ],
    },
  },
  {
    slug: 'ask-me',
    name: 'Ask-me',
    kind: 'Voice AI · Hackathon',
    blurb: 'A phone agent that tracks caller mood and hands off to a human when a call goes wrong.',
    stack: ['Python', 'LiveKit', 'Gemini Live'],
    repo: `${GH}/ask-me`,
    oneLiner: 'voice agent with human handoff · LiveKit',
    visual: 'voice',
    caseStudy: {
      eyebrow: 'Voice AI · Hackathon',
      tagline: 'A phone agent that tracks caller mood *and hands off to a human when a call goes wrong.*',
      facts: [
        { label: 'Context', value: '[[Hackathon *solo*]]' },
        { label: 'Stack', value: 'Python · LiveKit Agents · Gemini Live' },
        { label: 'Interfaces', value: 'Phone / browser mic · dark web UI' },
        { label: 'Links', value: '', links: [{ label: 'Source', href: `${GH}/ask-me` }] },
      ],
      problem: {
        title: 'A sales agent arguing with someone who said no is the default failure mode.',
        body: 'Realtime voice models sound confident whether or not they know the answer, and they rarely notice a call going sour. I wanted an intake agent that collects exactly what it is configured to, always says the lines compliance needs, and gets out of the way the moment a person would do better.',
      },
      decisions: [
        {
          title: 'Facts come from a registry, never from memory',
          body: 'The model may not answer product questions itself. It calls `answer_question` with a topic and delivers what comes back, or hands over. The agent can only ever be as wrong as `config.py`.',
        },
        {
          title: '“At least once” is a guarantee',
          body: 'Three layers: the prompt, tool results that re-tell the next line at the right moment, and a backstop sweep that fuzzy-matches the transcript and forces any owed script before the call ends.',
        },
        {
          title: 'Count bad turns, don’t average them',
          body: 'A judge model scores each caller turn from −1 to +1. On a real souring call the mean sat at −0.40, just under the bar; counting gave 3 of 4 negative turns, and handed over.',
        },
      ],
      architecture: {
        label:
          'Architecture: the caller joins a LiveKit room; the agent runs Gemini Live for conversation, a judge model for sentiment, and escalation triggers that end in a human handoff or a hangup',
        columns: [
          [{ name: 'Caller', note: 'phone · browser mic' }],
          [{ name: 'LiveKit room', note: 'audio · recording' }],
          [{ name: 'Agent', note: 'fields · facts · scripts', tone: 'accent' }],
          [
            { name: 'Gemini Live', note: 'realtime voice' },
            { name: 'Sentiment judge', note: 'per-turn score' },
            { name: 'Escalation watch', note: '7 triggers', tone: 'dashed' },
          ],
          [{ name: 'Human handoff', note: 'or polite hangup', tone: 'store' }],
        ],
        edges: ['audio', 'realtime', '', ''],
      },
      highlight: {
        eyebrow: 'Tuned on a real call',
        title: 'Patience is a config value.',
        body: 'Raise `negative_turns` to be more patient, lower it to hand over sooner. Scoring runs in a background task, so a slow or failed judge call never delays the conversation.',
        code: `SENTIMENT = SentimentConfig(
    window=4,              # recent turns weighed
    min_turns=2,           # never judge from one turn
    negative_below=-0.35,  # a "negative turn"
    negative_turns=3,      # this many → escalate
    severe_below=-0.85,    # one turn this bad → escalate
)`,
      },
      gallery: [],
      learned: [
        'Keyword triggers must be *narrow*. A bare “no” is an answer on an intake call. Checked against 20 genuine “no” answers from a real transcript, the refusal patterns fire on none of them.',
        'Watch the agent, not just the caller. Replaying a real call showed the human agent offering to take card details, so the sensitive trigger now listens to the agent’s own speech too.',
        'Free-tier quotas shape architecture: one judge call per turn blew through 15 requests a minute, so the judge throttles itself and skips filler like “Yep.”',
        '[[Draft written from the README. Rewrite these in your own words.]]',
      ],
    },
  },
  {
    slug: 'sentinel',
    name: 'Sentinel',
    kind: 'Agentic finance',
    blurb: 'Spots a cash crunch before it happens, and asks before it fixes it.',
    stack: ['Node.js', 'Socket.io', 'React', 'Function calling'],
    repo: `${GH}/sentinel`,
    oneLiner: 'agent that guards your cashflow · Node',
    visual: 'sentinel',
    caseStudy: {
      eyebrow: 'Agentic finance · Autonomous cashflow guardian',
      tagline: 'Spots a cash crunch before it happens, *and asks before it fixes it.*',
      facts: [
        { label: 'Context', value: '[[SBI Hackathon · Shortlisted]]' },
        { label: 'Stack', value: 'Node · Express · Socket.io · React' },
        { label: 'AI', value: 'Function-calling agent' },
        { label: 'Links', value: '', links: [{ label: 'Source', href: `${GH}/sentinel` }] },
      ],
      problem: {
        title: 'Banking apps look backward.',
        body: '“You spent 30% on dining” is useful a month too late. Sentinel looks forward instead, at your balance against the bills already scheduled, and steps in *before* a payment bounces, not after.',
      },
      decisions: [
        {
          title: 'Every purchase is an evaluation',
          body: 'Each transaction triggers the agent: it monitors, compares checking balance against upcoming mandates, and decides whether there is a deficit worth acting on.',
        },
        {
          title: 'Ask before acting',
          body: 'The agent prepares an intervention (move savings, liquidate investments), but transfers only execute through function calls after you approve them.',
        },
        {
          title: 'Live, not polled',
          body: 'Balances, interventions and transaction history stream to the dashboard over Socket.io, so the warning lands the moment the purchase does.',
        },
      ],
      architecture: {
        label:
          'Architecture: a React dashboard talks to an Express and Socket.io server; the server runs a function-calling agent against an LLM and the account and mandate state',
        columns: [
          [
            { name: 'Portfolio', note: 'cash · investments' },
            { name: 'Purchase triggers', note: '“Buy now”' },
            { name: 'Sentinel chat', note: 'approve / not now' },
          ],
          [{ name: 'Express + Socket.io', note: 'live updates' }],
          [{ name: 'Agent', note: 'monitor → analyse → decide → act', tone: 'accent' }],
          [
            { name: 'LLM', note: 'function calling' },
            { name: 'Accounts & mandates', note: 'balances · bills', tone: 'store' },
          ],
        ],
        edges: ['WebSocket', '', 'tools'],
      },
      highlight: {
        eyebrow: 'The demo',
        title: 'Rent is due tomorrow. You just bought headphones.',
        body: 'The whole story in five steps:',
        steps: [
          'Dashboard shows ₹15,000 in checking, ₹12,000 rent due tomorrow.',
          'Click “Buy Sony Headphones (₹29,990)”.',
          'The purchase succeeds, and checking goes negative.',
          'Sentinel warns that rent will fail and proposes a fix.',
          'Approve it: investments are liquidated to cover the deficit.',
        ],
      },
      gallery: [],
      learned: [
        '[[What building an agent that *acts on money* taught you, e.g. where you drew the line between suggestion and action.]]',
        '[[One thing about function calling or real-time UX you would do differently next time.]]',
      ],
    },
  },
  {
    slug: 'chalky',
    name: 'Chalky',
    kind: 'Real-time collaboration',
    blurb: 'A multiplayer whiteboard with live cursors, built on Next.js, Liveblocks and Convex.',
    stack: ['Next.js', 'Liveblocks', 'Convex', 'Clerk'],
    repo: `${GH}/chalky`,
    oneLiner: 'multiplayer whiteboard · Next.js',
    visual: 'chalky',
    caseStudy: {
      eyebrow: 'Real-time collaboration · Next.js',
      tagline: 'A multiplayer whiteboard *with live cursors.*',
      facts: [
        { label: 'Role', value: '[[Solo / team]]' },
        { label: 'Stack', value: 'Next.js 14 · Liveblocks · Convex' },
        { label: 'Auth', value: 'Clerk' },
        { label: 'Links', value: '', links: [{ label: 'Source', href: `${GH}/chalky` }] },
      ],
      hero: {
        src: '/work/chalky/board.png',
        alt: "A Chalky board with sticky notes, shapes and pencil strokes, one note selected, and Maya's and Aarav's live cursors",
      },
      problem: {
        title: 'Thinking together needs a shared surface.',
        body: '[[Chalky’s README is the Next.js starter, so this case study is drafted from its dependencies. Check it before publishing.]] A whiteboard where everyone sees the same canvas, each other’s cursors and each other’s strokes as they happen, with boards that are saved, shared and easy to come back to.',
      },
      decisions: [
        {
          title: 'Live state and saved state, kept apart',
          body: 'Liveblocks carries what changes many times a second: cursors, presence, layers on the canvas. Convex holds what should outlive a session: the boards themselves and favourites.',
        },
        {
          title: 'Strokes that feel like ink',
          body: '`perfect-freehand` turns pointer samples into pressure-shaped outlines, so a pencil stroke looks drawn rather than plotted.',
        },
        {
          title: 'Auth off the critical path',
          body: 'Clerk handles sign-in, and its identity is what Liveblocks rooms and Convex queries authorise against.',
        },
      ],
      architecture: {
        label:
          'Architecture: a Next.js app uses Liveblocks for real-time presence and canvas layers, Convex for persisted boards, and Clerk for authentication',
        columns: [
          [{ name: 'Next.js app', note: 'React · zustand' }],
          [
            { name: 'Liveblocks', note: 'cursors · layers', tone: 'accent' },
            { name: 'Convex', note: 'boards · favourites', tone: 'store' },
            { name: 'Clerk', note: 'auth', tone: 'dashed' },
          ],
        ],
        edges: [''],
      },
      gallery: [],
      learned: [
        '[[What real-time sync taught you: conflicts, latency, presence.]]',
        '[[What you would change about the split between Liveblocks and Convex.]]',
      ],
    },
  },
  {
    slug: 'web-rtc-voice',
    name: 'web-rtc-voice',
    kind: 'WebRTC · Node',
    blurb: 'Peer-to-peer voice calls with a share link or room code.',
    stack: ['WebRTC', 'Node.js', 'ws'],
    repo: `${GH}/web-rtc-voice`,
    oneLiner: 'p2p voice calls · WebRTC',
  },
  {
    slug: 'status-page',
    name: 'Status Page',
    kind: 'Next.js · Prisma',
    blurb: 'Multi-tenant status pages with incidents and live updates.',
    stack: ['Next.js', 'Prisma', 'PostgreSQL'],
    repo: `${GH}/status-page`,
    live: 'https://status-page-8h9m.vercel.app',
    oneLiner: 'multi-tenant status pages · Next.js',
  },
  {
    slug: 'wakepy',
    name: 'Wakepy',
    kind: 'Python · CLI',
    blurb: 'A terminal alarm clock that can email, text or call you.',
    stack: ['Python'],
    repo: `${GH}/alarm-cli`,
    oneLiner: 'alarm clock CLI · Python',
  },
  {
    slug: 'jourme',
    name: 'Jourme',
    kind: 'Expo · Supabase',
    blurb: '[[One line about what Jourme does.]]',
    stack: ['Expo', 'Supabase'],
    repo: `${GH}/jourme`,
    oneLiner: '[[one line]] · Expo',
  },
];

export const caseStudies = projects.filter((p): p is Project & { caseStudy: CaseStudy } => !!p.caseStudy);
export const caseStudyHref = (slug: string) => `/work/${slug}/`;
