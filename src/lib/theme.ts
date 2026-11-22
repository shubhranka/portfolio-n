export type Theme = 'dark' | 'light';

const KEY = 'theme';
const EVENT = 'themechange';

export const getTheme = (): Theme =>
  document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* storage unavailable — theme just won't persist */
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#F6F2EA' : '#0E0D0C');
  document.querySelectorAll('[data-theme-toggle]').forEach((b) =>
    b.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'),
  );
  window.dispatchEvent(new CustomEvent(EVENT, { detail: theme }));
}

export const toggleTheme = () => setTheme(getTheme() === 'dark' ? 'light' : 'dark');

export const onThemeChange = (fn: (t: Theme) => void) =>
  window.addEventListener(EVENT, (e) => fn((e as CustomEvent<Theme>).detail));

/** Read a CSS custom property — scenes use this so 3D colours follow the theme tokens. */
export const cssVar = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export function bindThemeToggles() {
  setTheme(getTheme()); // sync labels + meta
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => b.addEventListener('click', toggleTheme));
}
