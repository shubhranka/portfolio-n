import { caseStudies, caseStudyHref, type Architecture, type Shot } from './data';
import { $, esc, fmt, icons, linkAttrs } from './lib/dom';
import { boot, footer, headerTools } from './shared';

const slug = document.body.dataset.slug;
const index = caseStudies.findIndex((p) => p.slug === slug);
if (index < 0) throw new Error(`No case study for "${slug}" in src/data.ts`);
const project = caseStudies[index];
const cs = project.caseStudy;
const next = caseStudies[(index + 1) % caseStudies.length];
const two = (n: number) => String(n).padStart(2, '0');

document.title = `${project.name} — case study · Shubhranka Varma`;
document.querySelector('meta[name="description"]')?.setAttribute('content', project.blurb);

function frame(shot: Shot, eager = false) {
  if (shot.src) {
    return `<div class="frame"><img src="${esc(shot.src)}" alt="${esc(shot.alt)}" width="1440" height="900" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" /></div>`;
  }
  return `
    <div class="frame frame-ph" role="img" aria-label="${esc(shot.alt)}" data-placeholder>
      <span class="glyph" aria-hidden="true">▢</span>
      <p>${esc(shot.alt)}</p>
      ${shot.caption ? `<p>${fmt(shot.caption)}</p>` : ''}
    </div>`;
}

function arch(a: Architecture) {
  const parts: string[] = [];
  a.columns.forEach((col, i) => {
    parts.push(
      `<div class="arch-col">${col
        .map((n) => `<div class="arch-node ${n.tone ?? ''}"><b>${esc(n.name)}</b>${n.note ? `<span>${esc(n.note)}</span>` : ''}</div>`)
        .join('')}</div>`,
    );
    if (i < a.columns.length - 1) {
      const label = a.edges[i] ?? '';
      parts.push(`<div class="arch-edge${label ? ' labeled' : ''}">${label ? `<span>${esc(label)}</span>` : ''}<i></i></div>`);
    }
  });
  return `<div class="arch" role="img" aria-label="${esc(a.label)}">${parts.join('')}</div>`;
}

const code = (src: string) =>
  esc(src)
    .replace(/(#.*)$/gm, '<span class="c">$1</span>')
    .replace(/(?<![\w.#&])(-?\d+(?:\.\d+)?)/g, '<span class="n">$1</span>');

const hl = cs.highlight;

$('#app')!.innerHTML = `
  <div class="particles" id="particles" aria-hidden="true"></div>
  <header class="wrap case-header">
    <a class="back" href="/#work">${icons.back}All work</a>
    <span class="case-count">Case study ${two(index + 1)} / ${two(caseStudies.length)}</span>
    ${headerTools}
  </header>

  <main>
    <section class="wrap case-intro">
      <span class="eyebrow">${esc(cs.eyebrow)}</span>
      <h1 class="case-title">${esc(project.name)}</h1>
      <p class="case-tagline accent-em">${fmt(cs.tagline)}</p>
      <div class="facts">
        ${cs.facts
          .map(
            (f) => `
          <div><span class="k">${esc(f.label)}</span>
            <span class="v">${f.links ? f.links.map((l) => `<a ${linkAttrs(l.href)}>${esc(l.label)}</a>`).join('') : fmt(f.value)}</span>
          </div>`,
          )
          .join('')}
      </div>
    </section>

    <section class="shot-hero">${frame(cs.hero, true)}</section>

    <section class="wrap section split">
      <div class="reveal">
        <span class="eyebrow">The problem</span>
        <h2>${fmt(cs.problem.title)}</h2>
      </div>
      <p class="prose reveal">${fmt(cs.problem.body)}</p>
    </section>

    <section class="wrap section" style="padding-top:24px">
      <span class="eyebrow">Key decisions</span>
      <div class="decisions">
        ${cs.decisions
          .map(
            (d, i) => `
          <div class="tile card">
            <span class="n">${two(i + 1)}</span>
            <h3>${fmt(d.title)}</h3>
            <p>${fmt(d.body)}</p>
          </div>`,
          )
          .join('')}
      </div>
    </section>

    <section class="wrap section" style="padding-top:24px">
      <span class="eyebrow">How it works</span>
      ${arch(cs.architecture)}
    </section>

    ${
      hl
        ? `
    <section class="wrap section highlight" style="padding-top:24px">
      <div class="highlight-copy reveal">
        <span class="eyebrow">${esc(hl.eyebrow)}</span>
        <h2>${fmt(hl.title)}</h2>
        <p>${fmt(hl.body)}</p>
      </div>
      <div class="highlight-media reveal">
        ${hl.shot ? frame(hl.shot) : ''}
        ${hl.code ? `<pre class="code"><code>${code(hl.code)}</code></pre>` : ''}
        ${hl.steps ? `<ol class="steps">${hl.steps.map((s) => `<li>${fmt(s)}</li>`).join('')}</ol>` : ''}
      </div>
    </section>`
        : ''
    }

    ${
      cs.gallery.length
        ? `
    <section class="wrap section" style="padding-top:24px">
      <span class="eyebrow">Screenshots</span>
      <div class="gallery">
        ${cs.gallery.map((g) => `<figure class="reveal">${frame(g)}${g.caption ? `<figcaption>${fmt(g.caption)}</figcaption>` : ''}</figure>`).join('')}
      </div>
    </section>`
        : ''
    }

    <section class="wrap section split" style="padding-top:24px">
      <div><span class="eyebrow">What I learned</span></div>
      <div class="prose reveal"><ul>${cs.learned.map((l) => `<li>${fmt(l)}</li>`).join('')}</ul></div>
    </section>

    <div class="wrap">
      <a class="next-card" href="${caseStudyHref(next.slug)}">
        <div class="tile">
          <div><div class="k">Next case study</div><div class="t">${esc(next.name)}</div></div>
          <span style="color:var(--accent-text)">${icons.arrow.replace(/width="16" height="16"/, 'width="28" height="28"')}</span>
        </div>
      </a>
    </div>
  </main>
  ${footer}`;

boot();

const start = () => import('./three/particles').then(({ initParticles }) => initParticles($('#particles')!));
if ('requestIdleCallback' in window) requestIdleCallback(() => void start(), { timeout: 800 });
else setTimeout(() => void start(), 1);
