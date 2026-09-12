(function (root) {
  "use strict";

  const REPLACEMENTS = [
    [/\butilize\b/gi, "use"],
    [/\bapproximately\b/gi, "about"],
    [/\bcommence\b/gi, "start"],
    [/\bterminate\b/gi, "end"],
    [/\bfacilitate\b/gi, "help"],
    [/\bdemonstrate\b/gi, "show"],
    [/\bprior to\b/gi, "before"],
    [/\bsubsequent to\b/gi, "after"],
    [/\bin order to\b/gi, "to"],
    [/\bdue to the fact that\b/gi, "because"]
  ];

  const PROTECTED_PATTERN =
    /(["'`][^"'`]+["'`])|(\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b)|(\b\d+(?:[.,:/-]\d+)*(?:%|[a-zA-Z]+)?\b)/g;

  function simplify(text, settings) {
    if (!text || shouldPreserveBlock(text)) return text;
    const protectedValues = [];
    let output = text.replace(PROTECTED_PATTERN, (match) => {
      const token = `__SEE_PROTECTED_${protectedValues.length}__`;
      protectedValues.push(match);
      return token;
    });

    for (const [pattern, replacement] of REPLACEMENTS) {
      output = output.replace(pattern, replacement);
    }

    output = splitLongSentences(output, Number(settings.level || 3));
    output = output.replace(/\s{2,}/g, " ").trim();
    protectedValues.forEach((value, index) => {
      output = output.replace(`__SEE_PROTECTED_${index}__`, value);
    });
    return output;
  }

  function splitLongSentences(text, level) {
    const maxWords = level >= 4 ? 16 : level >= 3 ? 22 : 30;
    return text
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => {
        const words = sentence.split(/\s+/);
        if (words.length <= maxWords) return sentence;
        return sentence.replace(/,\s+(and|but|which|because|while|although)\s+/gi, ". $1 ");
      })
      .join(" ");
  }

  function shouldPreserveBlock(text) {
    return /\b(warning|disclaimer|dosage|prescription|liability|investment|diagnosis)\b/i.test(text);
  }

  root.SeeRulesFallback = { simplify, shouldPreserveBlock };
  if (typeof module !== "undefined") module.exports = root.SeeRulesFallback;
})(typeof globalThis !== "undefined" ? globalThis : window);
