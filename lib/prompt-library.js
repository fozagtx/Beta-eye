(function (root) {
  "use strict";

  const PROMPT_VERSION = "see-prompts-v2.0.0";
  const MODES = {
    clarity: "Use plain language and short sentences.",
    focus: "Use compact paragraphs and clear topic flow.",
    dyslexia: "Use predictable sentence patterns and familiar words.",
    esl: "Explain idioms and avoid culture-specific shorthand.",
    lowVision: "Keep structure simple and avoid dense punctuation.",
  };

  function buildPrompt(settings, text) {
    const level = Number(settings.level || 3);
    return {
      version: PROMPT_VERSION,
      system:
        "You simplify web text for accessibility. Preserve meaning. Preserve proper nouns, numbers, quotes, code, citations, warnings, dates, prices, medication names, legal terms, and financial terms. Do not summarize away important facts. Return strict JSON only.",
      user: JSON.stringify({
        level,
        goal: MODES[settings.mode] || MODES.clarity,
        constraints: [
          "Keep named entities stable.",
          "Keep numeric values stable.",
          "Keep quoted text stable.",
          "Do not alter code, warnings, disclaimers, legal, medical, or financial claims.",
          "Return one simplified string in the text field.",
        ],
        outputSchema: { text: "string" },
        text,
      }),
    };
  }

  function parseAiResponse(raw) {
    if (!raw || typeof raw !== "string") return null;
    try {
      const parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ""));
      if (parsed && typeof parsed.text === "string" && parsed.text.trim())
        return parsed.text.trim();
    } catch (_error) {
      if (raw.trim()) return raw.trim();
    }
    return null;
  }

  root.SeePromptLibrary = { PROMPT_VERSION, buildPrompt, parseAiResponse };
  if (typeof module !== "undefined") module.exports = root.SeePromptLibrary;
})(typeof globalThis !== "undefined" ? globalThis : window);
