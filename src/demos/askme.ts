import { askMeReplay as d } from '../extras';
import { esc } from '../lib/dom';

const STEP_MS = 1500;

/**
 * Replays a recorded call line by line while the signal gauges follow.
 * Starts on the finished call; nothing plays until "Replay call" is pressed.
 */
export function mountAskMe(host: HTMLElement) {
  host.innerHTML = `
    <div class="demo-grid">
      <div class="demo-card">
        <span class="eyebrow">${esc(d.eyebrow)}</span>
        <h2 class="demo-title">${esc(d.title)}</h2>
        <p class="demo-intro">${esc(d.intro)}</p>
        <ol class="call" aria-live="polite"></ol>
      </div>
      <div class="demo-card signals">
        <span class="sim-label">Live signals</span>
        <div class="gauge" data-g="mood"><span>Caller mood</span><b></b><i aria-hidden="true"><i></i></i></div>
        <div class="gauge" data-g="fields"><span>Fields collected</span><b></b><i aria-hidden="true"><i></i></i></div>
        <div class="gauge" data-g="watch"><span>Escalation watchdog</span><b></b><i aria-hidden="true"><i></i></i></div>
        <button class="btn btn-sm" type="button" data-act="replay">Replay call</button>
      </div>
    </div>`;

  const call = host.querySelector<HTMLElement>('.call')!;
  const replay = host.querySelector<HTMLButtonElement>('[data-act="replay"]')!;
  let timer = 0;

  const gauge = (name: string, pct: number, text: string, tone: string) => {
    const g = host.querySelector<HTMLElement>(`[data-g="${name}"]`)!;
    g.querySelector('b')!.textContent = text;
    g.className = `gauge gauge-${tone}`;
    g.querySelector<HTMLElement>('i > i')!.style.width = `${pct}%`;
  };

  const signals = (s: { mood: number; fields: number; watch: number }) => {
    gauge('mood', s.mood, `${s.mood} / 100`, s.mood < 35 ? 'bad' : s.mood < 55 ? 'warn' : 'ok');
    gauge('fields', (s.fields / d.totalFields) * 100, `${s.fields} / ${d.totalFields}`, 'info');
    gauge('watch', s.watch, s.watch >= 100 ? 'TRIGGERED' : 'watching', 'warn');
  };

  const line = (i: number) => {
    const l = d.lines[i];
    const li = document.createElement('li');
    li.className = `call-line call-${l.who.toLowerCase()}`;
    li.innerHTML = `<span>${esc(l.who)}</span>${esc(l.text)}`;
    call.append(li);
    signals(l);
  };

  const handoff = () => {
    const li = document.createElement('li');
    li.className = 'call-handoff';
    li.textContent = `↪ ${d.handoff}`;
    call.append(li);
  };

  function play() {
    clearTimeout(timer);
    call.innerHTML = '';
    signals(d.start);
    replay.textContent = 'Playing…';
    let i = 0;
    const step = () => {
      if (i < d.lines.length) {
        line(i++);
        timer = window.setTimeout(step, STEP_MS);
      } else {
        handoff();
        replay.textContent = 'Replay call';
      }
    };
    timer = window.setTimeout(step, 400);
  }

  // Start on the finished call so the content reads without pressing anything.
  d.lines.forEach((_, i) => line(i));
  handoff();
  replay.addEventListener('click', play);
}
