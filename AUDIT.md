# Mochi v2 Audit

Date: 2026-09-12
Branch: `mochi-v2-improvements`

## Summary

Mochi is a promising MV3 prototype, but the current implementation is not production-safe. The largest risks are page-content logging, blanket content-script injection on every URL at `document_start`, hard failure when the Prompt API is unavailable, and destructive DOM replacement that can remove original content when AI output shape does not match the page.

## Findings

- `manifest.json` injects `config.js`, `marked.js`, `logger.js`, and `content.js` into `<all_urls>` at `document_start`. This expands privacy and breakage risk beyond user action.
- `background.js` contains hardcoded prompt text, uses stale `MindMeld` branding, and logs full prompt libraries to the extension console.
- `content.js` logs page structure, prompt text, chunk text, original snippets, and simplified snippets. This violates the local privacy promise even if logs remain local.
- `logger.js` accumulates arbitrary content logs and attempts to send them to a `storeLogs` background action that does not exist. This is dead, privacy-sensitive code.
- Simplification depends on `self.ai.languageModel` and throws on unsupported Chrome/model state instead of explaining status and using a deterministic fallback.
- `content.js` retries Prompt API simplification up to 20 times per chunk, recreating sessions repeatedly. This can hang pages and drain resources.
- DOM replacement is unsafe: paragraph count mismatches can remove original paragraphs, restore uses `data-original-html` plus `innerHTML`, and generated Markdown is rendered with `marked.parse` without sanitization.
- The original-to-simplified mapping is fragile. It stores serialized HTML on replacement nodes rather than stable in-memory node state, making restore risky and lossy.
- Selectors process broad readable areas but do not reliably skip forms, navigation, footers, editors, code, legal/medical/financial warnings, or sensitive sites.
- `dictionary.js` uses ES module exports but is not loaded as a module and is not referenced by manifest scripts, so proper-noun analysis appears dead.
- Popup HTML imports Google Fonts and Font Awesome from remote CDNs. MV3 extension pages should avoid remote assets and remote code/style dependencies.
- Popup and options UI have accessibility gaps: missing `lang`, limited status semantics, icon-only controls without visible text, incomplete labels, no focus management, and no reduced-motion handling.
- `options.html` references `useOpenDyslexic`, but no such element exists, so `options.js` can throw immediately.
- Branding is inconsistent across `Mochi` and `MindMeld` in config, background, options, and docs.
- `fonts.css` is empty and `Create a new file fonts.css` is an oddly named stray CSS file.
- `marked.js` is vendored without explicit third-party attribution in docs or notices.
- README overstates current behavior as offline/private while the code logs page content and has no fallback. It also assumes Dev/Canary-only setup.
- No package tooling, tests, CI, typed checks, fixture pages, security policy, contribution guide, or release process exist.

## Highest-Risk Areas To Fix First

1. Remove content logging and dead logger code.
2. Make simplification reversible without deleting original nodes.
3. Add deterministic fallback simplification for unsupported Prompt API states.
4. Reduce default host access by injecting content scripts only after user action.
5. Replace hardcoded prompts with a versioned prompt module and validate outputs.
