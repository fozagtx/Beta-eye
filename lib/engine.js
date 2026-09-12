(function (root) {
  "use strict";

  const MAX_AI_MS = 12000;

  async function simplifyPage() {
    const settings = await root.SeeSettings.getSettings();
    const site = root.SeeSettings.getSiteKey(location.href);
    if (settings.disabledSites.includes(site)) return result("disabled", "This site is disabled.");
    if (
      root.SeeSettings.isSensitiveUrl(location.href) &&
      !settings.allowedSensitiveSites.includes(site)
    ) {
      return result("sensitive", "See skips sensitive sites by default. You can override this in options.");
    }

    root.SeeRenderer.applyDisplay(settings);
    const records = root.SeeChunker.collectReadableText(document);
    if (!records.length) return result("empty", "No readable text was found.");

    const capability = await root.SeeCapability.detect();
    for (const record of records) {
      const simplified = await simplifyRecord(record, settings, capability);
      if (simplified && simplified !== record.text) {
        root.SeeRenderer.render(record, simplified, settings);
      }
    }
    return result("ready", capability.state === "ready" ? "Simplified locally with Gemini Nano." : "Simplified with rules fallback.");
  }

  async function simplifyRecord(record, settings, capability) {
    const key = root.SeeCache.keyFor(record.hash, settings, root.SeePromptLibrary.PROMPT_VERSION);
    const cached = root.SeeCache.get(key);
    if (cached) return cached.value;

    let simplified = null;
    if (settings.useAI && capability.state === "ready") {
      simplified = await simplifyWithAi(record.text, settings);
    }
    if (!simplified) {
      simplified = root.SeeRulesFallback.simplify(record.text, settings);
    }
    simplified = root.SeeSanitizer.textOnly(simplified);
    root.SeeCache.set(key, simplified);
    return simplified;
  }

  async function simplifyWithAi(text, settings) {
    if (!root.ai?.languageModel) return null;
    const prompt = root.SeePromptLibrary.buildPrompt(settings, text);
    const timeout = new Promise((resolve) => setTimeout(() => resolve(null), MAX_AI_MS));
    const work = (async () => {
      const session = await root.ai.languageModel.create({ systemPrompt: prompt.system });
      const raw = await session.prompt(prompt.user);
      if (session.destroy) session.destroy();
      return root.SeePromptLibrary.parseAiResponse(raw);
    })().catch(() => null);
    return Promise.race([work, timeout]);
  }

  function restorePage() {
    root.SeeRenderer.restoreAll(document);
    return result("original", "Original text restored.");
  }

  function result(state, message) {
    return { ok: true, state, message };
  }

  root.SeeEngine = { simplifyPage, restorePage, simplifyRecord, simplifyWithAi };
})(typeof globalThis !== "undefined" ? globalThis : window);
