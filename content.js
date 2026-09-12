(function () {
  "use strict";

  if (window.__betaEyeContentLoaded) return;
  window.__betaEyeContentLoaded = true;

  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    (async () => {
      if (request.action === "simplify") {
        sendResponse(await window.BetaEyeEngine.simplifyPage());
        return;
      }
      if (request.action === "restore") {
        sendResponse(window.BetaEyeEngine.restorePage());
        return;
      }
      if (request.action === "cancel") {
        window.BetaEyeEngine.cancel();
        sendResponse({ ok: true, state: "cancelled", message: "Cancellation requested." });
        return;
      }
      if (request.action === "speak") {
        sendResponse(window.BetaEyeEngine.speakSimplifiedText());
        return;
      }
      if (request.action === "toggleSimplification") {
        if (window.BetaEyeRenderer.state.simplified) sendResponse(window.BetaEyeEngine.restorePage());
        else sendResponse(await window.BetaEyeEngine.simplifyPage());
        return;
      }
      if (request.action === "applyDisplay") {
        window.BetaEyeRenderer.applyDisplay(request.settings);
        sendResponse({ ok: true });
      }
    })().catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  });

  window.BetaEyeSettings.getSettings().then((settings) => {
    const site = window.BetaEyeSettings.getSiteKey(location.href);
    if (settings.autoRunTrustedSites && settings.trustedSites.includes(site)) {
      window.BetaEyeEngine.simplifyPage();
    }
  });
})();
