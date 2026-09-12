(function (root) {
  "use strict";

  async function detect() {
    const userAgent = navigator.userAgent || "";
    const chromeVersion = parseChromeVersion(userAgent);
    const languageModel = root.ai && root.ai.languageModel;
    const deviceMemory = navigator.deviceMemory || null;
    const storageEstimate = await estimateStorage();

    if (!languageModel) {
      return status("fallback", "Prompt API is unavailable. Rules fallback is ready.", {
        chromeVersion,
        deviceMemory,
        storageEstimate,
        promptApi: false,
        fallbackEligible: true,
      });
    }

    try {
      const capabilities = await languageModel.capabilities();
      const availability = capabilities.available || capabilities.availability || "unknown";
      if (availability === "readily") {
        return status("ready", "Gemini Nano is ready for local simplification.", {
          chromeVersion,
          deviceMemory,
          storageEstimate,
          promptApi: true,
          availability,
          fallbackEligible: true,
        });
      }
      if (availability === "after-download") {
        return status("downloading", "Gemini Nano needs to finish downloading.", {
          chromeVersion,
          deviceMemory,
          storageEstimate,
          promptApi: true,
          availability,
          fallbackEligible: true,
        });
      }
      return status("fallback", "Prompt API is present but not ready. Rules fallback is active.", {
        chromeVersion,
        deviceMemory,
        storageEstimate,
        promptApi: true,
        availability,
        fallbackEligible: true,
      });
    } catch (error) {
      return status("fallback", "Could not query Prompt API. Rules fallback is active.", {
        chromeVersion,
        deviceMemory,
        storageEstimate,
        promptApi: true,
        error: error.message,
        fallbackEligible: true,
      });
    }
  }

  function parseChromeVersion(userAgent) {
    const match = userAgent.match(/(?:Chrome|Chromium)\/(\d+)/);
    return match ? Number(match[1]) : null;
  }

  async function estimateStorage() {
    if (!navigator.storage?.estimate) return null;
    try {
      const estimate = await navigator.storage.estimate();
      return {
        quota: estimate.quota || null,
        usage: estimate.usage || null,
        free: estimate.quota && estimate.usage ? estimate.quota - estimate.usage : null,
      };
    } catch (_error) {
      return null;
    }
  }

  function status(state, message, detail) {
    return { state, message, ...detail };
  }

  root.SeeCapability = { detect, parseChromeVersion, estimateStorage };
  if (typeof module !== "undefined") module.exports = root.SeeCapability;
})(typeof globalThis !== "undefined" ? globalThis : window);
