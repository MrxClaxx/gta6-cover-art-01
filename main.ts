// main.ts — entrypoint for Neon Coast Cover Studio (gta6-cover-art-01).
// Hands the app in: copies app/ and screenshots/ from this repository into
// the output directory and writes dossier.json with buildDossier from
// vendor/makefun-app.ts. Node 22, standard library only; outside the
// grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { buildDossier } from "./vendor/makefun-app.ts";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

const appDir = join(repoRoot, "app");
const shotsDir = join(repoRoot, "screenshots");
for (const dir of [appDir, shotsDir]) {
  if (!existsSync(dir)) throw new Error(`Neon Coast Cover Studio: missing ${dir}`);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
cpSync(appDir, join(outDir, "app"), { recursive: true });
cpSync(shotsDir, join(outDir, "screenshots"), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outDir, "dossier.json"), dossier);

const shotCount = readdirSync(shotsDir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).length;
console.log(
  `Neon Coast Cover Studio: wrote ${outDir} (${shotCount} screenshots, dossier ${dossier.length} bytes)`,
);
