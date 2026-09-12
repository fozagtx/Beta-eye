import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";

const files = [
  "manifest.json",
  "background.js",
  "files.html",
  "files.css",
  "files.js",
  "options.html",
  "options.css",
  "options.js",
  "content.css",
  "LICENSE",
  "THIRD_PARTY_NOTICES.md",
];

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });

for (const file of files) {
  if (existsSync(file)) await cp(file, `dist/${file}`, { recursive: true });
}

for (const dir of ["lib", "fonts", "images"]) {
  if (existsSync(dir)) await cp(dir, `dist/${dir}`, { recursive: true });
}

await mkdir("dist/vendor", { recursive: true });
await cp("node_modules/fflate/esm/browser.js", "dist/vendor/fflate.mjs");
await cp("node_modules/pdfjs-dist/legacy/build/pdf.min.mjs", "dist/vendor/pdf.mjs");
await cp("node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs", "dist/vendor/pdf.worker.min.mjs");

console.log("Built extension into dist/");
