# See

See is a Chrome MV3 accessibility extension for private, offline-first web text simplification and display customization.

The v2 direction is conservative: no external simplification calls, no API keys, no telemetry by default, and no page-content logging. When Chrome's Gemini Nano Prompt API is ready, See can use it locally. When it is unavailable, See uses a deterministic rules fallback.

## Current Features

- User-action script injection with `activeTab`.
- Optional trusted-site auto-run after user-approved host permission.
- Local Gemini Nano Prompt API adapter with rules fallback.
- Reversible simplification: original text is kept in memory and can be restored.
- Sensitive-site exclusions for banking, health, government, email, docs editors, and code repos.
- Profiles for cognitive load, dyslexia, focus, low vision, ESL, and custom use.
- OpenDyslexic, theme, spacing, reading-width, focus-ruler, paragraph pacing, and browser speech controls.
- First-run onboarding and troubleshooting pages.
- Progress and cancel controls for page simplification.
- Safe text-only change highlighting.
- Versioned prompt builder and cache keys.

## Privacy Model

See processes text locally in the browser. It does not send page content to a server, does not include API keys, and does not collect telemetry. The extension avoids logging prompts and page content.

Chrome's Prompt API and Gemini Nano availability depend on the user's browser channel, flags, model download state, hardware, and Chrome policy. If the local model is unavailable, See falls back to rules mode.

## Install For Local Testing

1. Run `npm install`.
2. Run `npm run build`.
3. Open `chrome://extensions/`.
4. Enable Developer mode.
5. Choose Load unpacked and select `dist/`.

For Gemini Nano testing, use a Chrome version/channel that supports the Prompt API and enable the required Chrome flags. See still works in fallback mode without the model.

## Development

```bash
npm run build
npm run lint
npm test
npm run typecheck
npm run format
```

## Architecture

- `popup.*`: status, profile, simplify, restore, and per-site disable controls.
- `options.*`: global display and privacy defaults.
- `background.js`: active-tab injection, command handling, status lookup, settings save.
- `content.js`: page message bridge.
- `lib/settings.js`: settings schema, migrations, sensitive-site rules.
- `lib/capability.js`: Prompt API and fallback status detection.
- `lib/prompt-library.js`: versioned Prompt API prompt builder.
- `lib/rules-fallback.js`: deterministic offline simplifier.
- `lib/chunker.js`: readable-text selector and skip logic.
- `lib/renderer.js`: text-only rendering and restore mapping.
- `lib/cache.js`: ephemeral simplification cache.

## Testing

Unit tests cover fallback preservation, prompt output parsing, chunk filtering, sanitizer behavior, settings migration, sensitive-site matching, and capability parsing.

Manual smoke tests:

1. Load `dist/` as an unpacked extension.
2. Open a normal article page and click Simplify page.
3. Confirm fallback mode works when Prompt API is unavailable.
4. Click Restore original and confirm original text returns.
5. Disable the site and confirm simplification controls are blocked.
6. Change options and confirm display settings apply on the next simplification.
7. Trust a site and enable auto-run only if you want persistent simplification on that host.

## Known Limitations

- Restore state is in-memory for the current page session.
- The fallback mode is deterministic and conservative; it is not as fluent as an available local model.
- AI responses are rendered as plain text only in this pass.
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
