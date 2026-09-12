(function (root) {
  "use strict";

  const memoryCache = new Map();

  function keyFor(hash, settings, promptVersion) {
    return [hash, settings.level, settings.mode, promptVersion].join(":");
  }

  function get(key) {
    return memoryCache.get(key) || null;
  }

  function set(key, value) {
    memoryCache.set(key, { value, createdAt: Date.now() });
  }

  function clear() {
    memoryCache.clear();
  }

  root.BetaEyeCache = { keyFor, get, set, clear };
  if (typeof module !== "undefined") module.exports = root.BetaEyeCache;
})(typeof globalThis !== "undefined" ? globalThis : window);
