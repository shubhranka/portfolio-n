import './styles.css';
import { profile } from './data';
import { icons } from './lib/dom';
import { live } from './lib/env';
import { initKonami } from './lib/konami';
import { initSecrets } from './lib/secrets';
import { initTerminal } from './lib/terminal';
import { bindThemeToggles } from './lib/theme';
import { initReveal, initTilt } from './lib/tilt';

/** Header tools shared by every page: terminal hint + theme toggle. */
export const headerTools = `
  <div class="header-tools">
    <button class="live-pill" type="button" data-live hidden></button>
    <button class="stone-counter" type="button" data-stones data-shelf hidden></button>
    <a class="kbd-hint tool-play" href="/play/">play</a>
    <button class="kbd-hint" type="button" data-terminal aria-label="Open terminal (press ~)"><span class="kbd-press">press </span>~</button>
    <button class="icon-btn" type="button" data-theme-toggle aria-label="Switch to light theme">${icons.moon}${icons.sun}</button>
  </div>`;

/** Header for pages outside the home page (Play, Secret). */
export const pageHeader = (current: 'play' | '') => `
  <header class="wrap site-header">
    <a class="brand" href="/" aria-label="${profile.name} — home">
      <span class="brand-mark">${profile.name[0]}</span>
      <span class="brand-name">${profile.name}</span>
    </a>
    <nav class="nav" aria-label="Main">
      <a href="/#work">Work</a><a href="/play/"${current === 'play' ? ' aria-current="page"' : ''}>Play</a><a href="/#lab">Lab</a><a href="/#contact">Contact</a>
    </nav>
    ${headerTools}
  </header>`;

export const footer = `
  <footer class="wrap site-footer">
    <span>© ${new Date().getFullYear()} ${profile.name}<button class="footer-stone" type="button" data-stone="footer" aria-label="A small amber stone"><i></i></button></span>
    <span>Built quietly · press ~ for a terminal</span>
  </footer>`;

/** Wire up behaviour common to every page, after its markup is in the DOM. */
export function boot() {
  bindThemeToggles();
  initTerminal();
  initTilt();
  initReveal();
  initSecrets();
  initKonami();
  // Live features are a separate chunk (with the Supabase client), fetched when idle.
  if (live) {
    const go = () => void import('./live').then((m) => m.initLive()).catch(() => {});
    if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 3000 });
    else setTimeout(go, 1500);
  }
}
