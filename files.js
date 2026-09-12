import { strFromU8, unzipSync } from "./vendor/fflate.mjs";
import * as pdfjsLib from "./vendor/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL("vendor/pdf.worker.min.mjs");

const redactor = {
  rules: [
    { type: "secret", pattern: /\bsk-or-v1-[A-Za-z0-9_-]{20,}\b/g },
    { type: "secret", pattern: /\b(?:sk|pk|rk)-[A-Za-z0-9_-]{16,}\b/g },
    { type: "secret", pattern: /\b(?:ghp|github_pat|xox[baprs]|AIza)[A-Za-z0-9_-]{12,}\b/g },
    { type: "email", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
    { type: "phone", pattern: /(?<!\d)(?:\+?\d[\d .()-]{7,}\d)(?!\d)/g },
    { type: "ssn", pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
    { type: "card", pattern: /\b(?:\d[ -]*?){13,19}\b/g },
  ],
  apply(value) {
    let text = String(value ?? "");
    const findings = [];
    for (const rule of this.rules) {
      text = text.replace(rule.pattern, (_match) => {
        findings.push(rule.type);
        return `[REDACTED_${rule.type.toUpperCase()}]`;
      });
    }
    return { text, findings };
  },
};

document.getElementById("files").addEventListener("change", async (event) => {
  const files = Array.from(/** @type {HTMLInputElement} */ (event.target).files || []);
  const results = document.getElementById("results");
  results.replaceChildren();
  let total = 0;
  for (const file of files) {
    const result = await scanFile(file);
    total += result.findings;
    results.append(renderResult(result));
  }
  document.getElementById("summary").textContent = files.length
    ? `${files.length} file${files.length === 1 ? "" : "s"} scanned. ${total} confidential value${total === 1 ? "" : "s"} found.`
    : "No files scanned yet.";
});

async function scanFile(file) {
  try {
    if (file.name.toLowerCase().endsWith(".pdf")) return scanPdf(file);
    return scanSpreadsheet(file);
  } catch (_error) {
    return { name: file.name, findings: 0, error: "This file could not be read safely." };
  }
}

async function scanPdf(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages = [];
  let findings = [];
  for (let index = 1; index <= pdf.numPages; index += 1) {
    const page = await pdf.getPage(index);
    const content = await page.getTextContent();
    const text = content.items.map((item) => item.str).join(" ");
    const redacted = redactor.apply(text);
    findings = findings.concat(redacted.findings);
    pages.push(`Page ${index}\n${redacted.text}`);
  }
  return { name: file.name, findings: findings.length, outputName: `${file.name}.redacted.txt`, output: pages.join("\n\n") };
}

async function scanSpreadsheet(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const archive = unzipSync(bytes);
  const shared = parseSharedStrings(archive["xl/sharedStrings.xml"]);
  const sheet = archive["xl/worksheets/sheet1.xml"];
  if (!sheet) throw new Error("No first worksheet");
  const xml = new DOMParser().parseFromString(strFromU8(sheet), "application/xml");
  const rows = [];
  let findings = [];
  for (const row of Array.from(xml.getElementsByTagName("row"))) {
    const cells = Array.from(row.getElementsByTagName("c")).map((cell) => {
      const raw = cell.getElementsByTagName("v")[0]?.textContent || "";
      const value = cell.getAttribute("t") === "s" ? shared[Number(raw)] || "" : raw;
      const redacted = redactor.apply(value);
      findings = findings.concat(redacted.findings);
      return csvEscape(redacted.text);
    });
    rows.push(cells.join(","));
  }
  return { name: file.name, findings: findings.length, outputName: `${file.name}.redacted.csv`, output: rows.join("\n") };
}

function parseSharedStrings(entry) {
  if (!entry) return [];
  const xml = new DOMParser().parseFromString(strFromU8(entry), "application/xml");
  return Array.from(xml.getElementsByTagName("si")).map((item) =>
    Array.from(item.getElementsByTagName("t")).map((text) => text.textContent).join(""),
  );
}

function csvEscape(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function renderResult(result) {
  const article = document.createElement("article");
  article.className = "result";
  const title = document.createElement("h2");
  title.textContent = result.name;
  const detail = document.createElement("p");
  detail.textContent = result.error || `${result.findings} confidential value${result.findings === 1 ? "" : "s"} found.`;
  article.append(title, detail);
  if (result.output) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `Download ${result.outputName}`;
    button.addEventListener("click", () => download(result.outputName, result.output));
    article.append(button);
  }
  return article;
}

function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
