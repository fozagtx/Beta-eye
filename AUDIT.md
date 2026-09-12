# Redacto v2 Audit

Date: 2026-09-12
Branch: `main`

## Summary

The inherited MV3 prototype had strong accessibility goals, but the baseline implementation was not production-safe. The largest risks were page-content logging, blanket content-script injection on every URL at `document_start`, hard failure when the Prompt API was unavailable, and destructive DOM replacement that could remove original content when AI output shape did not match the page.

## Findings

- `manifest.json` injected multiple scripts into `<all_urls>` at `document_start`. This expanded privacy and breakage risk beyond user action.
- `background.js` contained hardcoded prompt text, stale branding, and logs of full prompt libraries to the extension console.
- `content.js` logs page structure, prompt text, chunk text, original snippets, and simplified snippets. This violates the local privacy promise even if logs remain local.
- `logger.js` accumulates arbitrary content logs and attempts to send them to a `storeLogs` background action that does not exist. This is dead, privacy-sensitive code.
- Simplification depends on `self.ai.languageModel` and throws on unsupported Chrome/model state instead of explaining status and using a deterministic fallback.
- `content.js` retries Prompt API simplification up to 20 times per chunk, recreating sessions repeatedly. This can hang pages and drain resources.
- DOM replacement was unsafe: paragraph count mismatches could remove original paragraphs, restore used `data-original-html` plus `innerHTML`, and generated Markdown was rendered without sanitization.
- The original-to-simplified mapping is fragile. It stores serialized HTML on replacement nodes rather than stable in-memory node state, making restore risky and lossy.
- Selectors process broad readable areas but do not reliably skip forms, navigation, footers, editors, code, legal/medical/financial warnings, or sensitive sites.
- `dictionary.js` uses ES module exports but is not loaded as a module and is not referenced by manifest scripts, so proper-noun analysis appears dead.
- Popup HTML imports Google Fonts and Font Awesome from remote CDNs. MV3 extension pages should avoid remote assets and remote code/style dependencies.
- Popup and options UI have accessibility gaps: missing `lang`, limited status semantics, icon-only controls without visible text, incomplete labels, no focus management, and no reduced-motion handling.
- `options.html` references `useOpenDyslexic`, but no such element exists, so `options.js` can throw immediately.
- Branding was inconsistent across config, background, options, and docs.
- `fonts.css` is empty and `Create a new file fonts.css` is an oddly named stray CSS file.
- A vendored Markdown parser was present without explicit third-party attribution in docs or notices.
- README overstates current behavior as offline/private while the code logs page content and has no fallback. It also assumes Dev/Canary-only setup.
- No package tooling, tests, CI, typed checks, fixture pages, security policy, contribution guide, or release process exist.

## Highest-Risk Areas To Fix First

1. Remove content logging and dead logger code.
2. Make simplification reversible without deleting original nodes.
3. Add deterministic fallback simplification for unsupported Prompt API states.
4. Reduce default host access by injecting content scripts only after user action.
5. Replace hardcoded prompts with a versioned prompt module and validate outputs.

## v2.1 Follow-Up Status

- Content logging and dead logger code were removed.
- Simplification now has text-only rendering, in-memory restore mapping, progress, and cancellation.
- Prompt API detection degrades to rules fallback.
- Trusted-site auto-run requires user-approved host permission.
- First-run onboarding and troubleshooting pages were added.
