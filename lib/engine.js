(function (root) {
  "use strict";

  let currentRun = null;

  async function simplifyPage() {
    currentRun = { cancelled: false, id: Date.now().toString(36) };
    const settings = await root.RedactoSettings.getSettings();
    const site = root.RedactoSettings.getSiteKey(location.href);
    if (settings.disabledSites.includes(site)) return result("disabled", "This site is disabled.");
    if (
      root.RedactoSettings.isSensitiveUrl(location.href) &&
      !settings.allowedSensitiveSites.includes(site)
    ) {
      return result(
        "sensitive",
        "Redacto skips sensitive sites by default. You can override this in options.",
      );
    }

    root.RedactoRenderer.applyDisplay(settings);
    const records = root.RedactoChunker.collectReadableText(document);
    if (!records.length) return result("empty", "No readable text was found.");

    await reportProgress(0, records.length, "Scanning locally for confidential data.");
    let changed = 0;
    for (let index = 0; index < records.length; index += 1) {
      if (currentRun.cancelled)
        return result("cancelled", "Scan cancelled. Original text is still available.");
      const record = records[index];
      const simplified = await simplifyRecord(record, settings);
      if (simplified && simplified !== record.text) {
        root.RedactoRenderer.render(record, simplified, settings);
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
      `${changed} text blocks redacted locally. Your original text is still restorable.`,
    );
  }

  async function simplifyRecord(record, settings) {
    const key = root.RedactoCache.keyFor(record.hash, settings, "redacto-redaction-v1");
    const cached = root.RedactoCache.get(key);
    if (cached) return cached.value;

    let simplified = null;
    simplified = root.RedactoRedactor.redact(record.text).text;
    simplified = root.RedactoSanitizer.textOnly(simplified);
    root.RedactoCache.set(key, simplified);
    return simplified;
  }


  function restorePage() {
    cancel();
    root.RedactoRenderer.restoreAll(document);
    return result("original", "Original text restored.");
  }

  function speakSimplifiedText() {
    const text = Array.from(document.querySelectorAll(".redacto-simplified-text"))
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

  function getRedactedText() {
    const text = Array.from(document.querySelectorAll(".redacto-simplified-text"))
      .map((element) => element.textContent.trim())
      .filter(Boolean)
      .join("\n\n");
    return text ? { ok: true, text } : result("empty", "Redact the page before copying its text.");
  }

  function cancel() {
    if (currentRun) currentRun.cancelled = true;
  }

  async function reportProgress(done, total, message) {
    if (!chrome.storage?.session) return;
    await chrome.storage.session.set({
      "redacto:progress": {
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

  root.RedactoEngine = {
    simplifyPage,
    restorePage,
    simplifyRecord,
    speakSimplifiedText,
    getRedactedText,
    cancel,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
