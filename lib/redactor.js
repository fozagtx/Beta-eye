/** @type {Array<[string, RegExp]>} */
const RULES = [
  ["secret", /\bsk-or-v1-[A-Za-z0-9_-]{20,}\b/g],
  ["secret", /\b(?:sk|pk|rk)-[A-Za-z0-9_-]{16,}\b/g],
  ["secret", /\b(?:ghp|github_pat|xox[baprs]|AIza)[A-Za-z0-9_-]{12,}\b/g],
  ["email", /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi],
  ["phone", /(?<!\d)(?:\+?\d[\d .()-]{7,}\d)(?!\d)/g],
  ["ssn", /\b\d{3}-\d{2}-\d{4}\b/g],
  ["card", /\b(?:\d[ -]*?){13,19}\b/g],
];

export function redact(value) {
  let text = String(value ?? "");
  let findings = 0;
  for (const [type, pattern] of RULES) {
    text = text.replace(pattern, () => {
      findings += 1;
      return `[REDACTED_${type.toUpperCase()}]`;
    });
  }
  return { text, findings };
}
