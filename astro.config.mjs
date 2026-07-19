// @ts-check
import { defineConfig } from 'astro/config';

/**
 * ELWIS liegt auf GitHub Pages unter https://schelltom.github.io/elwis/.
 * `base` sorgt dafür, dass alle Pfade unter dem Unterordner funktionieren –
 * in der App selbst werden deshalb nur relative Pfade ("./app.js") verwendet.
 */
export default defineConfig({
  site: 'https://schelltom.github.io',
  base: '/elwis',
});
