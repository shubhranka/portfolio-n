import { caseStudies, caseStudyHref, lab, profile, projects, sphereTags, toolbox, type Project } from './data';
import { demoTiles, stoneTag } from './extras';
import { $, esc, fmt, icons, linkAttrs } from './lib/dom';
import { findStone } from './lib/progress';
import { boot, footer, headerTools } from './shared';

const ph = (on?: boolean) => (on ? ' data-placeholder title="Placeholder: replace in src/data.ts"' : '');

const tags = (p: Project) => `<div class="tags">${p.stack.map((s) => `<span class="tag">${esc(s)}</span>`).join('')}</div>`;

const visuals: Record<NonNullable<Project['visual']>, () => string> = {
  zusk: () => `
    <div class="v-zusk" aria-hidden="true">
      <img src="/work/zusk/hero.png" alt="" loading="lazy" decoding="async" width="1440" height="900" />
    </div>`,
  pdf: () => `
    <div class="v-pdf" aria-hidden="true"><span></span><span></span>
      <span><i style="width:90%"></i><i class="hl" style="width:70%"></i><i style="width:80%"></i><i style="width:60%"></i></span>
    </div>`,
  voice: () =>
    `<div class="v-voice" aria-hidden="true">${Array.from({ length: 26 }, (_, b) =>
      `<i style="animation-delay:-${((b * 0.17) % 1.4).toFixed(2)}s;opacity:${(0.45 + ((b * 7) % 10) / 18).toFixed(2)}"></i>`,
    ).join('')}</div>`,
  sentinel: () => `
    <div class="v-sentinel" aria-hidden="true"><div>
      <b>Sentinel</b>
      <p>Rent of ₹12,000 is due tomorrow and your balance just went negative. Cover it from investments?</p>
      <div class="row"><span>Approve</span><span>Not now</span></div>
    </div></div>`,
  chalky: () => `
    <div class="v-chalky" aria-hidden="true">
      <div class="note"></div><div class="ring"></div>
      <div class="cur c1"><svg width="16" height="16" viewBox="0 0 24 24" fill="#8FB4FF"><path d="M4 3l16 7-7 2-2 7z"/></svg><span>Aditi</span></div>
      <div class="cur c2"><svg width="16" height="16" viewBox="0 0 24 24" fill="#F5A524"><path d="M4 3l16 7-7 2-2 7z"/></svg><span>You</span></div>
    </div>`,
};

function bentoTile(p: Project, i: number) {
  const size = i === 0 ? 'tile-feature' : i < 3 ? 'tile-md' : 'tile-wide';
  const extra = p.visual === 'chalky' ? ' tile-dots' : '';
  const visual = p.visual ? visuals[p.visual]() : '';
  const top =
    i === 0
      ? `<div class="tile-top"><span class="tile-kind">${esc(p.kind)}</span><span class="cs">Case study ↗</span></div>`
      : `<span class="tile-kind">${esc(p.kind)}</span>`;
  const tile = `
    <a class="tile ${demoTiles[p.slug] ? '' : size}${extra}" href="${caseStudyHref(p.slug)}" aria-label="${esc(p.name)} case study">
      ${top}
      <h3>${esc(p.name)}</h3>
      <p>${fmt(p.blurb)}</p>
      ${i === 0 ? tags(p) : ''}
      ${visual}
    </a>`;
  // A link can't hold another link, so the demo shortcut sits beside the tile.
  if (!demoTiles[p.slug]) return tile;
  return `
    <div class="tile-slot ${size}">
      ${tile}
      <a class="tile-demo" href="${caseStudyHref(p.slug)}#demo" aria-label="${esc(`${demoTiles[p.slug]}: ${p.name}`)}">
        <span aria-hidden="true">▶</span>${esc(demoTiles[p.slug])}
      </a>
    </div>`;
}

function smallTile(p: Project) {
  const href = p.live ?? p.repo;
  return `
    <a class="tile tile-sm" ${linkAttrs(href)}>
      <span class="tile-kind">${esc(p.kind)}</span>
      <h3>${esc(p.name)}</h3>
      <p>${fmt(p.blurb)}</p>
      <span class="arrow" aria-hidden="true">${icons.out}</span>
    </a>`;
}

const app = $('#app')!;
app.innerHTML = `
  <a class="skip" href="#work">Skip to work</a>
  <div class="particles" id="particles" aria-hidden="true"></div>
  <div class="glow" aria-hidden="true"></div>

  <header class="wrap site-header">
    <a class="brand" href="#top" aria-label="${esc(profile.name)}, home">
      <span class="brand-mark">${esc(profile.name[0])}</span>
      <span class="brand-name">${esc(profile.name)}</span>
    </a>
    <nav class="nav" aria-label="Main">
      <a href="#work">Work</a><a href="/play/">Play</a><a href="#lab">Lab</a><a href="#contact">Contact</a><a href="/sketches/">Sketches</a>
    </nav>
    ${headerTools}
  </header>

  <main>
    <section id="top" class="wrap hero">
      <div class="hero-copy">
        
        <h1 class="hero-h">${fmt(profile.headline)}</h1>
        <p class="hero-p">${fmt(profile.intro)}</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#work">See my work ${icons.arrow}</a>
          <a class="btn" ${linkAttrs(profile.resume.href)}${ph(profile.resume.placeholder)}>Résumé</a>
          <a class="btn" ${linkAttrs(profile.github)}>${icons.github}GitHub</a>
        </div>
      </div>
      <div class="hero-stage" id="hero-stage" role="img" aria-label="A morphing amber glass blob with orbit rings that leans toward the cursor">
        <div class="hero-shadow"></div>
      </div>
    </section>


    <section id="work" class="wrap section">
      <div class="section-head reveal">
        <div>
          <span class="eyebrow">01 · Selected work</span>
          <h2 class="h2">Things I've built, carefully.</h2>
        </div>
        <a class="muted-link" ${linkAttrs(profile.github)}>All ${esc(profile.repoCount)} repos on GitHub →</a>
      </div>
      <div class="bento">${caseStudies.map(bentoTile).join('')}</div>
      <div class="four">${projects.filter((p) => !p.caseStudy).map(smallTile).join('')}</div>
    </section>


    <section class="wrap section toolbox" aria-labelledby="toolbox-h">
      <div class="sphere-stage" id="sphere-stage" role="img" aria-label="Rotating 3D sphere of technology names: ${esc(sphereTags.join(', '))}. Drag or use the arrow keys to spin; Enter picks the tag in front.">
        <span class="sphere-hint" aria-hidden="true">drag to spin</span>
        <span class="sr-only" aria-live="polite" id="sphere-live"></span>
      </div>
      <div class="toolbox-copy reveal">
        <span class="eyebrow">02 · Toolbox</span>
        <h2 class="h2" id="toolbox-h">The tools I reach for.</h2>
        ${toolbox
          .map(
            (g) => `
          <div class="group">
            <span>${esc(g.group)}</span>
            <div>${g.items.map((i) => `<span class="chip" data-tag="${esc(i)}">${esc(i)}</span>`).join('')}</div>
          </div>`,
          )
          .join('')}
      </div>
    </section>

    <section id="lab" class="wrap section">
      <div class="section-head reveal">
        <div>
          <span class="eyebrow">03 · Lab</span>
          <h2 class="h2">Experiments &amp; <em>side quests.</em></h2>
        </div>
      </div>
      <div class="four">
        ${lab
          .map(
            (l) => `
          <a class="tile lab-card" ${linkAttrs(l.href)}>
            <div class="glyph" aria-hidden="true">${esc(l.glyph)}</div>
            <h3>${esc(l.name)}</h3>
            <p>${fmt(l.desc)}</p>
          </a>`,
          )
          .join('')}
      </div>
    </section>

    <section id="contact" class="contact">
      <div class="wave-stage" id="wave-stage" aria-hidden="true"></div>
      <div class="wave-fade" aria-hidden="true"></div>
      <span class="eyebrow">04 · Contact</span>
      <h2>Let's build something <em>calm.</em></h2>
      <a class="btn btn-mail" href="mailto:${esc(profile.email)}" data-copy="${esc(profile.email)}">${esc(profile.email)}</a>
      <span class="copied" aria-live="polite"></span>
      <div class="contact-links">
        <a ${linkAttrs(profile.github)}>GitHub</a>
        <a ${linkAttrs(profile.linkedin.href)}${ph(profile.linkedin.placeholder)}>LinkedIn</a>
        <a ${linkAttrs(profile.resume.href)}${ph(profile.resume.placeholder)}>Résumé</a>
      </div>
    </section>
  </main>
  ${footer}`;

boot();

// Copy the address too: mailto alone fails silently when there's no mail client.
const mail = $<HTMLAnchorElement>('[data-copy]')!;
mail.addEventListener('click', () => {
  navigator.clipboard?.writeText(mail.dataset.copy!).then(
    () => {
      const note = $('.copied')!;
      note.textContent = 'Address copied to clipboard';
      setTimeout(() => (note.textContent = ''), 2400);
    },
    () => {},
  );
});

// 3D scenes load after first paint so the page is readable immediately.
const startScenes = async () => {
  const [{ initHero }, { initParticles }, { initTagSphere }, { initWave }] = await Promise.all([
    import('./three/hero'),
    import('./three/particles'),
    import('./three/tagSphere'),
    import('./three/wave'),
  ]);
  initParticles($('#particles')!);
  initHero($('#hero-stage')!);
  initWave($('#wave-stage')!);
  const sphere = await initTagSphere($('#sphere-stage')!, sphereTags, {
    marked: stoneTag,
    onPick: (name) => {
      $('#sphere-live')!.textContent = name;
      if (name === stoneTag) findStone('sphere');
    },
  });
  if (sphere) {
    document.querySelectorAll<HTMLElement>('.chip[data-tag]').forEach((chip) => {
      chip.addEventListener('pointerenter', () => sphere.highlight(chip.dataset.tag!));
      chip.addEventListener('pointerleave', () => sphere.highlight(null));
    });
  }
};
if ('requestIdleCallback' in window) requestIdleCallback(() => void startScenes(), { timeout: 600 });
else setTimeout(() => void startScenes(), 1);

if (import.meta.env.DEV) {
  const n = document.querySelectorAll('.ph, [data-placeholder]').length;
  if (n) console.info(`[portfolio] ${n} placeholders on this page. Search src/data.ts for "[[" and "placeholder: true".`);
}
