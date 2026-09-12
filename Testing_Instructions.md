# Testing Instructions

## Automated

```bash
npm install
npm run lint
npm test
npm run typecheck
npm run build
```

## Manual Smoke Test

1. Load `dist/` from `chrome://extensions/`.
2. Visit an article page.
3. Open See and confirm the status says either Gemini Nano is ready or rules fallback is active.
4. Click Simplify page.
5. Confirm names, numbers, quotes, and warnings are preserved.
6. Click Restore original.
7. Disable the site and confirm See blocks simplification until re-enabled.
8. Open options and test OpenDyslexic, focus ruler, theme, spacing, and reading width.
9. Start simplification on a long article and confirm Cancel stops the active run.
10. Trust a non-sensitive test site, enable auto-run, reload the page, and confirm simplification starts only on that host.

## Sensitive-Site Test

Open a matching sensitive URL such as `https://mail.google.com/`. See should report that the site is skipped by default.
