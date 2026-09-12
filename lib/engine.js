(function (root) {
  "use strict";

  const MAX_AI_MS = 12000;
  let currentRun = null;

  async function simplifyPage() {
    currentRun = { cancelled: false, id: Date.now().toString(36) };
    const settings = await root.BetaEyeSettings.getSettings();
    const site = root.BetaEyeSettings.getSiteKey(location.href);
    if (settings.disabledSites.includes(site)) return result("disabled", "This site is disabled.");
    if (
      root.BetaEyeSettings.isSensitiveUrl(location.href) &&
      !settings.allowedSensitiveSites.includes(site)
    ) {
      return result(
        "sensitive",
        "Beta-eye skips sensitive sites by default. You can override this in options.",
      );
    }

    root.BetaEyeRenderer.applyDisplay(settings);
    const records = root.BetaEyeChunker.collectReadableText(document);
    if (!records.length) return result("empty", "No readable text was found.");

    const capability = await root.BetaEyeCapability.detect();
    await reportProgress(0, records.length, "Starting local simplification.");
    let changed = 0;
    for (let index = 0; index < records.length; index += 1) {
      if (currentRun.cancelled)
        return result("cancelled", "Simplification cancelled. Original text is still available.");
      const record = records[index];
      const simplified = await simplifyRecord(record, settings, capability);
      if (simplified && simplified !== record.text) {
        root.BetaEyeRenderer.render(record, simplified, settings);
        changed += 1;
      }
      await reportProgress(
        index + 1,
        records.length,
        `Processed ${index + 1} of ${records.length} text blocks.`,
      );
    }
    return result(
      "ready",
      `${changed} text blocks updated. ${capability.state === "ready" ? "Used Gemini Nano locally." : "Used rules fallback."}`,
    );
  }

  async function simplifyRecord(record, settings, capability) {
    const key = root.BetaEyeCache.keyFor(record.hash, settings, root.BetaEyePromptLibrary.PROMPT_VERSION);
    const cached = root.BetaEyeCache.get(key);
    if (cached) return cached.value;

    let simplified = null;
    if (settings.useAI && capability.state === "ready") {
      simplified = await simplifyWithAi(record.text, settings);
    }
    if (!simplified) {
      simplified = root.BetaEyeRulesFallback.simplify(record.text, settings);
    }
    simplified = root.BetaEyeSanitizer.textOnly(simplified);
    root.BetaEyeCache.set(key, simplified);
    return simplified;
  }

  async function simplifyWithAi(text, settings) {
    const languageModel = root.LanguageModel || root.ai?.languageModel;
    if (!languageModel) return null;
    const prompt = root.BetaEyePromptLibrary.buildPrompt(settings, text);
    const timeout = new Promise((resolve) => setTimeout(() => resolve(null), MAX_AI_MS));
    const work = (async () => {
      const session = await languageModel.create({ systemPrompt: prompt.system });
      const raw = await session.prompt(prompt.user);
      if (session.destroy) session.destroy();
      return root.BetaEyePromptLibrary.parseAiResponse(raw);
    })().catch(() => null);
    return Promise.race([work, timeout]);
  }

  function restorePage() {
    cancel();
    root.BetaEyeRenderer.restoreAll(document);
    return result("original", "Original text restored.");
  }

  function speakSimplifiedText() {
    const text = Array.from(document.querySelectorAll(".beta-eye-simplified-text"))
      .map((element) => element.textContent.trim())
      .filter(Boolean)
      .join("\n\n");
    if (!text) return result("empty", "Simplify text before using speech.");
    if (!("speechSynthesis" in root))
      return result("unsupported", "Browser speech is unavailable.");
    root.speechSynthesis.cancel();
    root.speechSynthesis.speak(new SpeechSynthesisUtterance(text.slice(0, 4000)));
    return result("speaking", "Speaking simplified text with browser speech.");
  }

  function cancel() {
    if (currentRun) currentRun.cancelled = true;
  }

  async function reportProgress(done, total, message) {
    if (!chrome.storage?.session) return;
    await chrome.storage.session.set({
      "beta-eye:progress": {
        done,
        total,
        message,
        updatedAt: Date.now(),
      },
    });
  }

  function result(state, message) {
    return { ok: true, state, message };
  }

  root.BetaEyeEngine = {
    simplifyPage,
    restorePage,
    simplifyRecord,
    simplifyWithAi,
    speakSimplifiedText,
    cancel,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
