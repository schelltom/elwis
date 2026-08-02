// @ts-check
import { defineConfig } from 'astro/config';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Schreibt nach dem Build eine manifest.json ins dist/ – die Grundlage für den
 * Auto-Mirror am ELW: der ELW-Server vergleicht nur die "version" und lädt bei
 * Änderung die App neu von GitHub Pages nach. Enthält je Datei eine Prüfsumme,
 * damit der Server unvollständige Downloads erkennt.
 */
function manifestIntegration() {
  return {
    name: 'elwis-manifest',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const distDir = fileURLToPath(dir);
        const dateien = [];
        (function walk(d) {
          for (const e of readdirSync(d, { withFileTypes: true })) {
            const full = path.join(d, e.name);
            if (e.isDirectory()) { walk(full); continue; }
            const rel = path.relative(distDir, full).split(path.sep).join('/');
            if (rel === 'manifest.json') continue;               // sich selbst nicht listen
            const buf = readFileSync(full);
            dateien.push({
              pfad: rel,
              groesse: buf.length,
              sha256: createHash('sha256').update(buf).digest('hex'),
            });
          }
        })(distDir);
        dateien.sort((a, b) => (a.pfad < b.pfad ? -1 : 1));

        // Version = Commit-Kurz-SHA (in GitHub Actions), sonst Inhalts-Hash aller Dateien.
        const inhaltsHash = createHash('sha256')
          .update(dateien.map((f) => f.sha256).join('')).digest('hex').slice(0, 12);
        const version = (process.env.GITHUB_SHA || '').slice(0, 7) || inhaltsHash;

        const manifest = { version, erstellt: new Date().toISOString(), dateien };
        writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifest));
        console.log(`[elwis-manifest] ${dateien.length} Dateien, Version ${version}`);
      },
    },
  };
}

/**
 * ELWIS liegt auf GitHub Pages unter https://schelltom.github.io/elwis/.
 * `base` sorgt dafür, dass alle Pfade unter dem Unterordner funktionieren –
 * in der App selbst werden deshalb nur relative Pfade ("./app.js") verwendet.
 */
export default defineConfig({
  site: 'https://schelltom.github.io',
  base: '/elwis',
  integrations: [manifestIntegration()],
});
