import * as esbuild from "esbuild";
import { copyFileSync, cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, "src");
const distDir = join(__dirname, "dist");
const iconsDir = join(__dirname, "..", "icons");

mkdirSync(distDir, { recursive: true });

const sharedAliasPlugin = {
  name: "shared-alias",
  setup(build) {
    build.onResolve({ filter: /^@grokipedia-first\/shared$/ }, () => ({
      path: join(__dirname, "..", "shared", "src", "index.ts"),
    }));
  },
};

const common = {
  bundle: true,
  platform: "browser",
  target: "es2022",
  format: "esm",
  sourcemap: true,
  plugins: [sharedAliasPlugin],
};

await esbuild.build({
  ...common,
  entryPoints: [join(srcDir, "background.ts")],
  outfile: join(distDir, "background.js"),
});

await esbuild.build({
  ...common,
  entryPoints: [join(srcDir, "content-popover.ts")],
  outfile: join(distDir, "content-popover.js"),
});

await esbuild.build({
  ...common,
  entryPoints: [join(srcDir, "options.ts")],
  outfile: join(distDir, "options.js"),
});

copyFileSync(join(srcDir, "options.html"), join(distDir, "options.html"));
copyFileSync(join(srcDir, "privacy.html"), join(distDir, "privacy.html"));
copyFileSync(join(srcDir, "options.css"), join(distDir, "options.css"));
copyFileSync(join(srcDir, "content-popover.css"), join(distDir, "content-popover.css"));
copyFileSync(join(__dirname, "manifest.json"), join(distDir, "manifest.json"));

cpSync(iconsDir, join(distDir, "icons"), { recursive: true });

console.log("Chrome extension built to chrome/dist/");
