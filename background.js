(function () {
  "use strict";

  importScripts("lib/settings.js", "lib/capability.js");

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
      await chrome.storage.local.set({ "see:onboarded": false });
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
        const settings = await globalThis.SeeSettings.saveSettings(request.settings);
        if ("autoRunTrustedSites" in request.settings || "trustedSites" in request.settings) {
          await refreshTrustedScripts();
        }
        sendResponse({ ok: true, settings });
      }
      if (request.action === "requestTrustedSite" && request.origin && request.site) {
        const granted = await chrome.permissions.request({ origins: [`${request.origin}/*`] });
        if (granted) {
          const settings = await globalThis.SeeSettings.getSettings();
          const trustedSites = Array.from(new Set([...settings.trustedSites, request.site]));
          await globalThis.SeeSettings.saveSettings({ trustedSites });
          await refreshTrustedScripts();
          sendResponse({
            ok: true,
            granted,
            settings: await globalThis.SeeSettings.getSettings(),
          });
          return;
        }
        sendResponse({ ok: true, granted: false });
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
    const settings = await globalThis.SeeSettings.getSettings();
    if (!settings.autoRunTrustedSites || !settings.trustedSites.length) return;
    await chrome.scripting.registerContentScripts([
      {
        id: "see-trusted-auto-run",
        matches: settings.trustedSites.map((site) => `*://${site}/*`),
        js: CONTENT_FILES,
        css: ["content.css"],
        runAt: "document_idle",
        persistAcrossSessions: true,
      },
    ]);
  }

  async function getStatus(url) {
    const capability = await globalThis.SeeCapability.detect();
    const settings = await globalThis.SeeSettings.getSettings();
    const site = globalThis.SeeSettings.getSiteKey(url || "");
    const siteDisabled = Boolean(site && settings.disabledSites.includes(site));
    const sensitive =
      globalThis.SeeSettings.isSensitiveUrl(url || "") &&
      !settings.allowedSensitiveSites.includes(site);
    const onboarded = await globalThis.SeeSettings.getOnboardingState();
    return { ok: true, capability, site, siteDisabled, sensitive, settings, onboarded };
  }

  function isHttpUrl(url) {
    return /^https?:\/\//.test(url || "");
  }
})();
