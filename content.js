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
})();
