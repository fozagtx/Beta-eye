(function (root) {
  "use strict";

  const RULES = [
    { type: "secret", pattern: /\bsk-or-v1-[A-Za-z0-9_-]{20,}\b/g },
    { type: "secret", pattern: /\b(?:sk|pk|rk)-[A-Za-z0-9_-]{16,}\b/g },
    { type: "secret", pattern: /\b(?:ghp|github_pat|xox[baprs]|AIza)[A-Za-z0-9_-]{12,}\b/g },
    { type: "secret", pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{16,}\b/gi },
    { type: "secret", pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g },
    { type: "email", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
    { type: "phone", pattern: /(?<!\d)(?:\+?\d[\d .()-]{7,}\d)(?!\d)/g },
    { type: "ssn", pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
    { type: "card", pattern: /\b(?:\d[ -]*?){13,19}\b/g },
  ];

  function redact(text) {
    let output = String(text || "");
    const findings = [];
    for (const rule of RULES) {
      output = output.replace(rule.pattern, (match) => {
        if (match.includes("[REDACTED_")) return match;
        findings.push({ type: rule.type, value: match });
        return `[REDACTED_${rule.type.toUpperCase()}]`;
      });
    }
    return { text: output, findings };
  }

  root.RedactoRedactor = { redact };
  if (typeof module !== "undefined") module.exports = root.RedactoRedactor;
})(typeof globalThis !== "undefined" ? globalThis : window);
