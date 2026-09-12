(function () {
  "use strict";

  if (window.__seeContentLoaded) return;
  window.__seeContentLoaded = true;

  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    (async () => {
      if (request.action === "simplify") {
        sendResponse(await window.SeeEngine.simplifyPage());
        return;
      }
      if (request.action === "restore") {
        sendResponse(window.SeeEngine.restorePage());
        return;
      }
      if (request.action === "cancel") {
        window.SeeEngine.cancel();
        sendResponse({ ok: true, state: "cancelled", message: "Cancellation requested." });
        return;
      }
      if (request.action === "speak") {
        sendResponse(window.SeeEngine.speakSimplifiedText());
        return;
      }
      if (request.action === "toggleSimplification") {
        if (window.SeeRenderer.state.simplified) sendResponse(window.SeeEngine.restorePage());
        else sendResponse(await window.SeeEngine.simplifyPage());
        return;
      }
      if (request.action === "applyDisplay") {
        window.SeeRenderer.applyDisplay(request.settings);
        sendResponse({ ok: true });
      }
    })().catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  });

  window.SeeSettings.getSettings().then((settings) => {
    const site = window.SeeSettings.getSiteKey(location.href);
    if (settings.autoRunTrustedSites && settings.trustedSites.includes(site)) {
      window.SeeEngine.simplifyPage();
    }
  });
})();
