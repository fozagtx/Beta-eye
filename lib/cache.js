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

  root.SeeCache = { keyFor, get, set };
  if (typeof module !== "undefined") module.exports = root.SeeCache;
})(typeof globalThis !== "undefined" ? globalThis : window);
