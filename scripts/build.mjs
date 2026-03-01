import { build } from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const DIST_DIR = path.resolve("dist");
const SRC_DIR = path.resolve("src");

const args = new Set(process.argv.slice(2));
const watch = args.has("--watch");

async function rmrf(p) {
  await fs.rm(p, { recursive: true, force: true });
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function copyDir(from, to) {
  await ensureDir(to);
  const entries = await fs.readdir(from, { withFileTypes: true });
  await Promise.all(
    entries.map(async (ent) => {
      const src = path.join(from, ent.name);
      const dst = path.join(to, ent.name);
      if (ent.isDirectory()) return copyDir(src, dst);
      await fs.copyFile(src, dst);
    }),
  );
}

async function writeManifest() {
  const manifestSrc = path.join(SRC_DIR, "manifest.json");
  const manifestDst = path.join(DIST_DIR, "manifest.json");
  await fs.copyFile(manifestSrc, manifestDst);
}

async function copyStatic() {
  const staticDir = path.join(SRC_DIR, "static");
  try {
    await copyDir(staticDir, DIST_DIR);
  } catch (err) {
    if (err && err.code === "ENOENT") return;
    throw err;
  }
}

async function bundle() {
  await ensureDir(DIST_DIR);

  await Promise.all([
    build({
      bundle: true,
      sourcemap: true,
      format: "iife",
      target: "es2022",
      logLevel: "info",
      entryPoints: {
        "content-script": "src/content/content-script.ts",
        "popup/popup": "src/popup/popup.ts",
      },
      outdir: DIST_DIR,
      loader: { ".css": "text" },
    }),
    build({
      bundle: true,
      sourcemap: true,
      format: "esm",
      target: "es2022",
      logLevel: "info",
      entryPoints: {
        background: "src/background/background.ts",
      },
      outdir: DIST_DIR,
    }),
  ]);
  await writeManifest();
  await copyStatic();
}

if (!watch) {
  await rmrf(DIST_DIR);
  await bundle();
  process.exit(0);
}

await rmrf(DIST_DIR);
await bundle();
console.log("Watch mode not implemented; run `npm run build` after changes.");
