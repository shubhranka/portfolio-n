import { $, esc } from './lib/dom';
import { boot, footer, pageHeader } from './shared';

type Sketch = { src: string; title: string; text: string; w: number; h: number };

// Rendered at 2x from the "Concept sketch" boards in the design file.
const sketches: Sketch[] = [
  {
    src: '/sketches/journeys.png',
    title: 'Visitor journeys',
    text: 'Four kinds of visitor, four paths. Yellow marks the moments that hook them, and every path ends in a reason to write to me.',
    w: 2880,
    h: 2020,
  },
  {
    src: '/sketches/home-wireframe.png',
    title: 'Home wireframe',
    text: 'The home page top to bottom: glass blob hero, bento grid of work, three roles, the tag sphere and the wave footer.',
    w: 2200,
    h: 3440,
  },
  {
    src: '/sketches/games-secrets.png',
    title: 'Games & secrets',
    text: 'Every game teaches one thing about my work, and nothing blocks the content.',
    w: 2200,
    h: 1840,
  },
];

$('#app')!.innerHTML = `
  <a class="skip" href="#sketches">Skip to sketches</a>
  ${pageHeader('sketches')}
  <main id="sketches">
    <section class="wrap play-intro">
      <span class="eyebrow">Before the code</span>
      <h1 class="h2 sketch-title">Concept <em>sketches</em></h1>
      <p class="sketch-lede">How the site was planned. Click a sketch to open it full size in a new tab.</p>
    </section>
    <section class="wrap sketch-list">
      ${sketches
        .map(
          (s, i) => `
        <figure class="sketch">
          <a class="sketch-frame" href="${esc(s.src)}" target="_blank" rel="noopener" aria-label="${esc(s.title)}, full size (opens in a new tab)">
            <img src="${esc(s.src)}" alt="${esc(`Hand-drawn concept sketch: ${s.title}`)}" width="${s.w / 2}" height="${s.h / 2}"${i ? ' loading="lazy"' : ''} decoding="async" />
          </a>
          <figcaption><strong>${esc(s.title)}</strong> ${esc(s.text)}</figcaption>
        </figure>`,
        )
        .join('')}
    </section>
  </main>
  ${footer}`;

boot();
