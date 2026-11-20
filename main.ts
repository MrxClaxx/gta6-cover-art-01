// Leonida Nights — entrypoint for make.fun's "Make GTA 6 Cover Art".
// Node 22, standard library only. Copies app/ and screenshots/ into the
// output directory and writes /output/dossier.json with buildDossier from
// vendor/makefun-app.ts. Outside the grader, MAKEFUN_OUTPUT_DIR stands in
// for /output. Running it twice writes the same bytes.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');
const appDir = join(repoRoot, 'app');
const shotsDir = join(repoRoot, 'screenshots');

if (!existsSync(appDir)) throw new Error('Leonida Nights: app/ is missing from ' + repoRoot);
if (!existsSync(shotsDir)) throw new Error('Leonida Nights: screenshots/ is missing from ' + repoRoot);

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
cpSync(appDir, join(outDir, 'app'), { recursive: true });
cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

const cap = Math.floor(1.5 * 1024 * 1024);
if (dossier.length > cap) throw new Error('Leonida Nights: dossier.json is ' + dossier.length + ' bytes, over the 1.5 MiB cap');
if (dossier.length === 0) throw new Error('Leonida Nights: dossier.json came out empty');
console.log('Leonida Nights: wrote ' + outDir + ' (dossier.json ' + dossier.length + ' bytes)');
