# Redacto

Redacto finds private information in text before you share it with an AI tool.

It works on your device. It replaces things like email addresses, phone numbers, card numbers, and access keys with clear markers. You can review the result, copy it, and paste it into any AI tool yourself.

![Redacto side panel](docs/redacto-side-panel-reference.png)

## What It Does

- Scans text files, PDFs, and Excel files.
- Finds common private information locally.
- Shows the number of private values found in each file.
- Shows a redacted preview without destroying the original file.
- Creates downloadable redacted copies for review.
- Works entirely on local files before you share them.

## Privacy

Redacto does not send your page text anywhere. It has no account, API key, tracking, or automatic upload.

Detection is deterministic and conservative. No automated detector can identify every confidential value, so review the redacted text before sharing it.

## Install

1. Run `npm install`.
2. Run `npm run build`.
3. Open `chrome://extensions/`.
4. Enable Developer mode.
5. Choose Load unpacked and select `dist/`.

Redacto does not require a model download or a network connection.

## Development

```bash
npm run build
npm run lint
npm test
npm run typecheck
npm run format
```

## For Developers

- `files.*`: the Chrome side panel and file scanning workspace.
- `background.js`: opens the side panel from the toolbar.
- `lib/redactor.js`: local detection rules.

## Checks

The automated checks cover confidential-data detection and safe output handling.

## Known Limitations

- Detection is deterministic and conservative; it cannot identify every confidential value.
- Always review the redacted text before sharing it with an LLM.

## Release

1. Update version in `manifest.json` and `package.json`.
2. Run `npm run lint`, `npm test`, `npm run typecheck`, and `npm run build`.
3. Load `dist/` manually and complete smoke tests.
4. Package the contents of `dist/`.

## Roadmap

- Add Playwright E2E tests with fixture pages.
- Add OCR for scanned PDFs.
- Add stronger address and name detection.
- Preserve more Excel workbook formatting in downloaded files.
