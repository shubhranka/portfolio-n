import './styles.css';
import { profile } from './data';
import { icons } from './lib/dom';
import { initTerminal } from './lib/terminal';
import { bindThemeToggles } from './lib/theme';
import { initReveal, initTilt } from './lib/tilt';

/** Header tools shared by every page: terminal hint + theme toggle. */
export const headerTools = `
  <div class="header-tools">
    <button class="kbd-hint" type="button" data-terminal aria-label="Open terminal (press ~)">press ~</button>
    <button class="icon-btn" type="button" data-theme-toggle aria-label="Switch to light theme">${icons.moon}${icons.sun}</button>
  </div>`;

export const footer = `
  <footer class="wrap site-footer">
    <span>© ${new Date().getFullYear()} ${profile.name}</span>
    <span>Built quietly · press ~ for a terminal</span>
  </footer>`;

/** Wire up behaviour common to every page, after its markup is in the DOM. */
export function boot() {
  bindThemeToggles();
  initTerminal();
  initTilt();
  initReveal();
}
