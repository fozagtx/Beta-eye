(function () {
  "use strict";

  if (window.__betaEyeContentLoaded) return;
  window.__betaEyeContentLoaded = true;

  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    (async () => {
      if (request.action === "simplify") {
        sendResponse(await window.RedactoEngine.simplifyPage());
        return;
      }
      if (request.action === "restore") {
        sendResponse(window.RedactoEngine.restorePage());
        return;
      }
      if (request.action === "getRedactedText") {
        sendResponse(window.RedactoEngine.getRedactedText());
        return;
      }
      if (request.action === "cancel") {
        window.RedactoEngine.cancel();
        sendResponse({ ok: true, state: "cancelled", message: "Cancellation requested." });
        return;
      }
      if (request.action === "speak") {
        sendResponse(window.RedactoEngine.speakSimplifiedText());
        return;
      }
      if (request.action === "toggleSimplification") {
        if (window.RedactoRenderer.state.simplified) sendResponse(window.RedactoEngine.restorePage());
        else sendResponse(await window.RedactoEngine.simplifyPage());
        return;
      }
      if (request.action === "applyDisplay") {
        window.RedactoRenderer.applyDisplay(request.settings);
        sendResponse({ ok: true });
      }
    })().catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  });

  window.RedactoSettings.getSettings().then((settings) => {
    const site = window.RedactoSettings.getSiteKey(location.href);
    if (settings.autoRunTrustedSites && settings.trustedSites.includes(site)) {
      window.RedactoEngine.simplifyPage();
    }
  });
})();
