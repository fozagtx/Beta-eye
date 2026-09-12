import { strFromU8, unzipSync } from "./vendor/fflate.mjs";
import * as pdfjsLib from "./vendor/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL("vendor/pdf.worker.min.mjs");

/** @type {Array<[string, RegExp]>} */
const rules = [
  ["secret", /\bsk-or-v1-[A-Za-z0-9_-]{20,}\b/g],
  ["secret", /\b(?:sk|pk|rk)-[A-Za-z0-9_-]{16,}\b/g],
  ["secret", /\b(?:ghp|github_pat|xox[baprs]|AIza)[A-Za-z0-9_-]{12,}\b/g],
  ["email", /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi],
  ["phone", /(?<!\d)(?:\+?\d[\d .()-]{7,}\d)(?!\d)/g],
  ["ssn", /\b\d{3}-\d{2}-\d{4}\b/g],
  ["card", /\b(?:\d[ -]*?){13,19}\b/g],
];
const state = { results: [] };
const input = /** @type {HTMLInputElement} */ (document.getElementById("files"));
input.addEventListener("change", () => scanFiles(Array.from(input.files || [])));
document.getElementById("newFile").addEventListener("click", () => {
  state.results = [];
  input.value = "";
  document.getElementById("resultsState").hidden = true;
  document.getElementById("emptyState").hidden = false;
});
document
  .getElementById("downloadAll")
  .addEventListener("click", () =>
    state.results.forEach((result) => download(result.outputName, result.output)),
  );

async function scanFiles(files) {
  if (!files.length) return;
  state.results = [];
  for (const file of files) state.results.push(await scanFile(file));
  renderResults();
}

async function scanFile(file) {
  try {
    if (file.name.toLowerCase().endsWith(".pdf")) return scanPdf(file);
    if (file.name.toLowerCase().endsWith(".xlsx")) return scanSpreadsheet(file);
    return scanText(file);
  } catch (_error) {
    return {
      name: file.name,
      outputName: `${file.name}.redacted.txt`,
      output: "",
      findings: 0,
      error: "This file could not be read safely.",
    };
  }
}

async function scanText(file) {
  const redacted = redact(await file.text());
  return {
    name: file.name,
    outputName: `${file.name}.redacted.txt`,
    output: redacted.text,
    findings: redacted.findings,
  };
}

async function scanPdf(file) {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
    .promise;
  const pages = [];
  let findings = 0;
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const redacted = redact(content.items.map((item) => item.str).join(" "));
    findings += redacted.findings;
    pages.push(`Page ${pageNumber}\n${redacted.text}`);
  }
  return {
    name: file.name,
    outputName: `${file.name}.redacted.txt`,
    output: pages.join("\n\n"),
    findings,
  };
}

async function scanSpreadsheet(file) {
  const archive = unzipSync(new Uint8Array(await file.arrayBuffer()));
  const sharedStrings = parseSharedStrings(archive["xl/sharedStrings.xml"]);
  const xml = new DOMParser().parseFromString(
    strFromU8(archive["xl/worksheets/sheet1.xml"]),
    "application/xml",
  );
  const rows = [];
  let findings = 0;
  for (const row of Array.from(xml.getElementsByTagName("row"))) {
    const cells = Array.from(row.getElementsByTagName("c")).map((cell) => {
      const raw = cell.getElementsByTagName("v")[0]?.textContent || "";
      const value = cell.getAttribute("t") === "s" ? sharedStrings[Number(raw)] || "" : raw;
      const redacted = redact(value);
      findings += redacted.findings;
      return csvEscape(redacted.text);
    });
    rows.push(cells.join(","));
  }
  return {
    name: file.name,
    outputName: `${file.name}.redacted.csv`,
    output: rows.join("\n"),
    findings,
  };
}

function parseSharedStrings(entry) {
  if (!entry) return [];
  const xml = new DOMParser().parseFromString(strFromU8(entry), "application/xml");
  return Array.from(xml.getElementsByTagName("si")).map((item) =>
    Array.from(item.getElementsByTagName("t"))
      .map((text) => text.textContent)
      .join(""),
  );
}
function redact(value) {
  let text = String(value ?? "");
  let findings = 0;
  for (const [type, pattern] of rules)
    text = text.replace(pattern, () => {
      findings += 1;
      return `[REDACTED_${type.toUpperCase()}]`;
    });
  return { text, findings };
}
function csvEscape(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function renderResults() {
  const total = state.results.reduce((sum, result) => sum + result.findings, 0);
  document.getElementById("emptyState").hidden = true;
  document.getElementById("resultsState").hidden = false;
  document.getElementById("totalCount").textContent = String(total);
  document.getElementById("fileCount").textContent = String(state.results.length);
  document.getElementById("summary").textContent =
    `${total} confidential value${total === 1 ? "" : "s"} redacted locally.`;
  const list = document.getElementById("fileList");
  list.replaceChildren();
  state.results.forEach((result) => {
    const item = document.createElement("div");
    item.className = "file-item";
    const name = document.createElement("strong");
    name.textContent = `${result.name} · ${result.findings} found`;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Download";
    button.addEventListener("click", () => download(result.outputName, result.output));
    item.append(name, button);
    list.append(item);
  });
  selectResult(0);
}
function selectResult(index) {
  const result = state.results[index];
  document.getElementById("currentFile").textContent = result.name;
  document.getElementById("preview").textContent = result.error || result.output;
}
function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
