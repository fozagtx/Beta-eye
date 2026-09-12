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
3. Open Redacto and confirm the status says it is ready to redact locally.
4. Click Redact page.
5. Confirm names, numbers, quotes, and warnings are preserved.
6. Click Restore original.
7. Disable the site and confirm Redacto blocks scanning until re-enabled.
8. Open options and test OpenDyslexic, focus ruler, theme, spacing, and reading width.
9. Start scanning on a long article and confirm Cancel stops the active run.
10. Trust a non-sensitive test site, enable auto-run, reload the page, and confirm scanning starts only on that host.

## Sensitive-Site Test

Open a matching sensitive URL such as `https://mail.google.com/`. Redacto should report that the site is skipped by default.
