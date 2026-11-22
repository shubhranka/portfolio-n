import { playPage } from '../extras';
import { award } from '../lib/progress';

const t = playPage.blob;
const ANNOYED = 6;
const WOBBLY = 2;
/** Anger drains at this rate per second, so only fast pokes build it up. */
const COOL = 1.4;

type Mood = keyof typeof t.moods;

/** The hero blob, pokeable. Falls back to a CSS blob without WebGL. */
export async function mount(card: HTMLElement) {
  const meta = card.querySelector<HTMLElement>('.game-meta')!;
  const body = card.querySelector<HTMLElement>('.game-body')!;
  body.innerHTML = `
    <button class="blob-stage" type="button" aria-label="Poke the blob"><span class="blob-css" aria-hidden="true"></span></button>
    <div class="game-foot">
      <span>Mood: <b class="blob-mood" role="status"></b></span>
      <button class="btn btn-sm" type="button" data-act="calm">${t.calm}</button>
    </div>`;

  const stage = body.querySelector<HTMLButtonElement>('.blob-stage')!;
  const moodEl = body.querySelector<HTMLElement>('.blob-mood')!;
  let pokes = 0;
  let anger = 0;
  let last = performance.now();
  let raf = 0;
  let mood: Mood | null = null;
  let wasAnnoyed = false;

  const { initHero } = await import('../three/hero');
  const hero = initHero(stage, { playground: true });
  if (hero) stage.classList.add('has-gl');

  const moodOf = (a: number): Mood => (a > ANNOYED ? 'annoyed' : a > WOBBLY ? 'wobbly' : 'calm');

  function update() {
    const now = performance.now();
    anger = Math.max(0, anger - COOL * ((now - last) / 1000));
    last = now;
    const m = moodOf(anger);
    if (m !== mood) {
      mood = m;
      moodEl.textContent = t.moods[m];
      moodEl.className = `blob-mood mood-${m}`;
      stage.dataset.mood = m;
      hero?.setAnger(m === 'annoyed' ? 1 : m === 'wobbly' ? 0.3 : 0);
      if (m === 'annoyed') wasAnnoyed = true;
      // Calmed down on its own after being annoyed.
      if (m === 'calm' && wasAnnoyed) {
        wasAnnoyed = false;
        award('blob');
      }
    }
    meta.textContent = `pokes: ${pokes}`;
    raf = anger > 0 ? requestAnimationFrame(update) : 0;
  }

  const kick = () => {
    last = performance.now();
    if (!raf) raf = requestAnimationFrame(update);
  };

  stage.addEventListener('click', () => {
    update();
    pokes++;
    anger += 1;
    hero?.poke();
    stage.classList.remove('poked');
    void stage.offsetWidth; // restart the CSS squish
    stage.classList.add('poked');
    kick();
  });

  // "Let it calm down" drains anger faster instead of snapping to calm.
  body.querySelector('[data-act="calm"]')!.addEventListener('click', () => {
    anger = Math.min(anger, WOBBLY + 0.5);
    kick();
  });

  update();
}
