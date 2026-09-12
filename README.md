# Redacto

Redacto is a Chrome MV3 extension that finds confidential data locally before you share text with any LLM.

Redacto never uploads page text. It scans locally, replaces detected confidential values with clear markers, and keeps the original page restorable.

## Current Features

- User-action script injection with `activeTab`.
- Optional trusted-site auto-run after user-approved host permission.
- Local detection for emails, phone numbers, payment cards, government identifiers, tokens, and common API keys.
- Reversible redaction: original text is kept in memory and can be restored.
- Sensitive-site exclusions for banking, health, government, email, docs editors, and code repos.
- Profiles for cognitive load, dyslexia, focus, low vision, ESL, and custom use.
- OpenDyslexic, theme, spacing, reading-width, focus-ruler, paragraph pacing, and browser speech controls.
- First-run onboarding and troubleshooting pages.
- Progress and cancel controls for page scanning.
- Safe text-only change highlighting.
- Versioned prompt builder and cache keys.

## Privacy Model

Redacto processes page text locally. It does not send page content to a server, store API keys, or collect telemetry. You review the redacted result and choose what to paste into an LLM yourself.

Detection is deterministic and conservative. No automated detector can identify every confidential value, so review the redacted text before sharing it.

## Install For Local Testing

1. Run `npm install`.
2. Run `npm run build`.
3. Open `chrome://extensions/`.
4. Enable Developer mode.
5. Choose Load unpacked and select `dist/`.

Redacto does not require a model download, Chrome flags, or a network connection.

## Development

```bash
npm run build
npm run lint
npm test
npm run typecheck
npm run format
```

## Architecture

- `popup.*`: side-panel status, scan, restore, and per-site disable controls.
- `options.*`: global display and privacy defaults.
- `background.js`: active-tab injection, command handling, status lookup, settings save.
- `content.js`: page message bridge.
- `lib/settings.js`: settings schema, migrations, sensitive-site rules.
- `lib/redactor.js`: deterministic local confidential-data detector.
- `lib/chunker.js`: readable-text selector and skip logic.
- `lib/renderer.js`: text-only rendering and restore mapping.
- `lib/cache.js`: ephemeral simplification cache.

## Testing

Unit tests cover confidential-data detection, chunk filtering, sanitizer behavior, and settings migration.

Manual smoke tests:

1. Load `dist/` as an unpacked extension.
2. Open a normal article page and click Redact page.
3. Confirm detected emails, phone numbers, cards, and tokens are replaced locally.
4. Click Restore original and confirm original text returns.
5. Disable the site and confirm redaction controls are blocked.
6. Change options and confirm display settings apply on the next scan.
7. Trust a site and enable auto-run only if you want persistent scanning on that host.

## Known Limitations

- Restore state is in-memory for the current page session.
- Detection is deterministic and conservative; it cannot identify every confidential value.
- Always review the redacted text before sharing it with an LLM.
- Browser speech uses the local browser speech engine and is capped to the first 4000 characters.

## Release Process

1. Update version in `manifest.json` and `package.json`.
2. Run `npm run lint`, `npm test`, `npm run typecheck`, and `npm run build`.
3. Load `dist/` manually and complete smoke tests.
4. Package the contents of `dist/`.

## Roadmap

- Add Playwright E2E tests with fixture pages.
- Add richer readable-content scoring for complex app layouts.
- Add per-site profile presets.
- Add stronger dynamic-page restore reconciliation.
- Add packaged release signing notes.
