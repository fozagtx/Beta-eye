import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";

const files = [
  "manifest.json",
  "background.js",
  "popup.html",
  "popup.css",
  "popup.js",
  "options.html",
  "options.css",
  "options.js",
  "content.css",
  "LICENSE",
  "THIRD_PARTY_NOTICES.md"
];

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });

for (const file of files) {
  if (existsSync(file)) await cp(file, `dist/${file}`, { recursive: true });
}

for (const dir of ["lib", "fonts", "images"]) {
  if (existsSync(dir)) await cp(dir, `dist/${dir}`, { recursive: true });
}

console.log("Built extension into dist/");
