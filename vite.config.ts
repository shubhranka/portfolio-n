import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// One HTML entry per case study: work/<slug>/index.html
const caseStudies = Object.fromEntries(
  readdirSync(resolve(import.meta.dirname, 'work')).map((slug) => [slug, resolve(import.meta.dirname, 'work', slug, 'index.html')]),
);

export default defineConfig({
  build: {
    target: 'es2022',
    // three.js is one lazy-loaded chunk (~140 kB gzip), fetched after first paint.
    chunkSizeWarningLimit: 650,
    rolldownOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        play: resolve(import.meta.dirname, 'play', 'index.html'),
        secret: resolve(import.meta.dirname, 'secret', 'index.html'),
        sketches: resolve(import.meta.dirname, 'sketches', 'index.html'),
        ...caseStudies,
      },
    },
  },
});
