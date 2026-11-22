/**
 * Tiny JSON wrapper over localStorage. Storage can be missing or throw
 * (private windows, blocked site data), so every call falls back quietly.
 */
const PREFIX = 'sv:';

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable, so progress just won't persist */
  }
}

/** Forget everything this site saved except the theme. */
export function clearAll() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* nothing to clear */
  }
}
