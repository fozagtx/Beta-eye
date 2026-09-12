(function () {
  "use strict";

  importScripts("lib/settings.js", "lib/capability.js", "lib/prompt-library.js");

  const CONTENT_FILES = [
    "lib/settings.js",
    "lib/capability.js",
    "lib/prompt-library.js",
    "lib/rules-fallback.js",
    "lib/chunker.js",
    "lib/sanitizer.js",
    "lib/cache.js",
    "lib/renderer.js",
    "lib/engine.js",
    "content.js",
  ];

  chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason === "install") {
      await chrome.storage.local.set({ "beta-eye:onboarded": false });
      await chrome.tabs.create({ url: chrome.runtime.getURL("onboarding.html") });
    }
    await refreshTrustedScripts();
  });

  chrome.runtime.onStartup.addListener(refreshTrustedScripts);

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    (async () => {
      if (request.action === "getStatus") {
        sendResponse(await getStatus(request.url));
        return;
      }
      if (request.action === "injectContent" && request.tabId) {
        await ensureContent(request.tabId);
        sendResponse({ ok: true });
      }
      if (request.action === "saveSettings") {
        const settings = await globalThis.BetaEyeSettings.saveSettings(request.settings);
        if ("autoRunTrustedSites" in request.settings || "trustedSites" in request.settings) {
          await refreshTrustedScripts();
        }
        sendResponse({ ok: true, settings });
      }
      if (request.action === "requestTrustedSite" && request.origin && request.site) {
        const granted = await chrome.permissions.request({ origins: [`${request.origin}/*`] });
        if (granted) {
          const settings = await globalThis.BetaEyeSettings.getSettings();
          const trustedSites = Array.from(new Set([...settings.trustedSites, request.site]));
          await globalThis.BetaEyeSettings.saveSettings({ trustedSites });
          await refreshTrustedScripts();
          sendResponse({
            ok: true,
            granted,
            settings: await globalThis.BetaEyeSettings.getSettings(),
          });
          return;
        }
        sendResponse({ ok: true, granted: false });
      }
      if (request.action === "openRouterSimplify" && typeof request.text === "string") {
        sendResponse(await simplifyWithOpenRouter(request.text, request.settings || {}));
      }
    })().catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  });

  chrome.commands.onCommand.addListener(async (command, tab) => {
    if (command !== "toggle-simplification" || !tab?.id || !isHttpUrl(tab.url)) return;
    await ensureContent(tab.id);
    chrome.tabs.sendMessage(tab.id, { action: "toggleSimplification" });
  });

  async function ensureContent(tabId) {
    await chrome.scripting.executeScript({ target: { tabId }, files: CONTENT_FILES });
    await chrome.scripting.insertCSS({ target: { tabId }, files: ["content.css"] });
  }

  async function refreshTrustedScripts() {
    await chrome.scripting.unregisterContentScripts().catch(() => undefined);
    const settings = await globalThis.BetaEyeSettings.getSettings();
    if (!settings.autoRunTrustedSites || !settings.trustedSites.length) return;
    await chrome.scripting.registerContentScripts([
      {
        id: "beta-eye-trusted-auto-run",
        matches: settings.trustedSites.map((site) => `*://${site}/*`),
        js: CONTENT_FILES,
        css: ["content.css"],
        runAt: "document_idle",
        persistAcrossSessions: true,
      },
    ]);
  }

  async function getStatus(url) {
    const capability = await globalThis.BetaEyeCapability.detect();
    const settings = await globalThis.BetaEyeSettings.getSettings();
    const site = globalThis.BetaEyeSettings.getSiteKey(url || "");
    const siteDisabled = Boolean(site && settings.disabledSites.includes(site));
    const sensitive =
      globalThis.BetaEyeSettings.isSensitiveUrl(url || "") &&
      !settings.allowedSensitiveSites.includes(site);
    const onboarded = await globalThis.BetaEyeSettings.getOnboardingState();
    return { ok: true, capability, site, siteDisabled, sensitive, settings, onboarded };
  }

  async function simplifyWithOpenRouter(text, settings) {
    const key = await globalThis.BetaEyeSettings.getOpenRouterKey();
    if (!key) return { ok: false, error: "OpenRouter API key is not configured." };
    const prompt = buildOpenRouterPrompt(settings, text);
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: settings.openRouterModel || "openrouter/free",
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
        temperature: 0.1,
        max_tokens: 1200,
      }),
    });
    if (!response.ok) return { ok: false, error: `OpenRouter request failed (${response.status}).` };
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string") return { ok: false, error: "OpenRouter returned no text." };
    const parsed = globalThis.BetaEyePromptLibrary.parseAiResponse(content);
    return parsed ? { ok: true, text: parsed } : { ok: false, error: "OpenRouter returned invalid text." };
  }

  function buildOpenRouterPrompt(settings, text) {
    return globalThis.BetaEyePromptLibrary.buildPrompt(settings, text);
  }

  function isHttpUrl(url) {
    return /^https?:\/\//.test(url || "");
  }
})();
