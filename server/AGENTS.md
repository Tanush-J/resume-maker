# AGENTS.md — `server/` (Active Backend / PDF Renderer)

## Stack & Purpose

Express + Puppeteer + firebase-admin. The server's only job is generating **A4 PDFs of resumes**. It verifies the Firebase ID token, reads the resume from Firestore (or accepts one in the request body), renders it to HTML/CSS, and returns a PDF. The server does **not** decide pagination — it reproduces the client's measured `layoutPlan` exactly.

## Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | none | `{ status: 'ok' }` |
| `POST` | `/api/resumes/:resumeId/pdf` | Bearer JWT | Renders resume → A4 PDF (`Content-Type: application/pdf`) |

- Auth: `Authorization: Bearer <token>` verified with `auth.verifyIdToken(token)`; decoded UID is `req.user.uid`.
- Resume source: `req.body.resume` if present (client sends it); otherwise `loadResume` reads `users/{uid}/resumes/{resumeId}` from Firestore and re-checks `ownerId` server-side. The client-supplied `ownerId` is always overridden by the authenticated UID.
- CORS: comma-separated `ALLOWED_ORIGINS` env var (default `http://localhost:5173`, matching the Vite client).
- Request body limit: 32kb (`express.json`).
- Input validation: `server/validation.js` (resume shape, layout-plan shape, template/version match, URL schemes, size limits) → `422` on failure. HTTP codes: `400` malformed, `401` bad token, `403` ownership, `404` missing resume, `422` invalid data, `500` renderer failure.

## Key Files

| File | Purpose |
|---|---|
| `server.js` | Express app; auth middleware; PDF endpoint; Puppeteer browser reuse (`getBrowser`), 30s render timeout, SSRF guard (localhost + `data:` URLs allowed, all else blocked); graceful shutdown |
| `firebase.js` | firebase-admin init from env vars (`FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY`); fails fast at startup |
| `validation.js` | `validateResume`, `validateLayoutPlan`, `validateLimits`, `validateUrl` — used by the PDF route before rendering |
| `templates/registry.js` | Server template registry — `registerTemplateRenderer`, `getTemplateRenderer(id, version)`. Classic self-registers on import. |
| `templates/classic.js` | Classic renderer (`render: (resume, layoutPlan) → { html, css }`); reads `classic.css` at load; two render paths (below) |
| `templates/classic.css` | Shared canonical resume styles — **do not fork this**; single source of truth with `vite-client`; contains design tokens in `:root` |
| `assets/fontawesome/` | Vendored FontAwesome 6.5.1 CSS + webfonts (no external CDN in the PDF path) |
| `assets/fonts/` | Vendored Inter variable font (`inter.css` + `inter-latin.woff2`) so Puppeteer measures the same font as the client |
| `fontAssets.js` | Embedded font-asset loader: reads registered font CSS, resolves local `url(...)` to `data:` URLs, caches result; `validateFontAssets()` for startup fail-fast |
| `test/pdfFonts.test.js` | Regression tests (plan §20–22): font validation, embedded CSS verification, E2E Puppeteer font-loading + icon rendering + zero-network-requests |

## Rendering (templates/classic.js)

- **Plan-driven path** (used by the client, which always sends a `layoutPlan`): renders blocks per page exactly as measured/laid out on the frontend (block ids match the client's semantic blocks: `experience-heading`, `${itemId}-head`, `${itemId}-bullet-N`, `social-N`, `education-N`, etc.). Page constants `794×1123px` **must match** `classicTemplate.page` in `vite-client/src/components/resumeBuilder/templates.ts`.
- **Continuation headings** are resolved from explicit `block.continuationMetadata.title` serialized in the layout plan — never inferred by string-sniffing block ids (legacy id sniffing kept only as a transitional fallback).
- **Legacy fallback path** (no `layoutPlan`): estimation-based pagination (`buildMainFragments`/`paginateFragments`) is isolated in `renderLegacyFallback()` — labelled legacy compatibility, not a competing layout engine. Known limitation (retained): sidebar only renders on page 0 in this fallback.
- Only `classic` template v1 is supported by the registry — adding a template requires changes here **and** on the client.

## Dead Files — Do Not Touch / Reference

- `server/style.css` — unused one-rule placeholder.

## Fonts / Icons (no external CDN in the PDF path)

- The PDF renderer uses only **vendored local assets**:
  - Inter variable font: `server/assets/fonts/inter.css` + `inter-latin.woff2`
  - Font Awesome 6.5.1: `server/assets/fontawesome/css/all.min.css` + `webfonts/`
- `server/fontAssets.js` reads registered font CSS at startup, resolves every local
  `url(...)` to a base64 `data:` URL, and caches the result in memory. The PDF
  endpoint injects this embedded CSS via `<style>` in `documentMarkup` — **no HTTP
  fetch, no CORS, no localhost dependency** for fonts.
- `validateFontAssets()` runs at startup (fail-fast on missing assets); missing
  fallback sources (e.g. `fa-brands-400.ttf` when `woff2` exists) produce a warning,
  not a hard error — the `woff2` still loads fine.
- Adding a new font: place files + CSS under `server/assets/`, add an entry to
  `FONT_STYLESHEETS` in `fontAssets.js`. No changes to `server.js` or Puppeteer logic.
- The browser uses byte-identical copies in `vite-client/public/fonts/` and
  `vite-client/public/fontawesome/` so measurement and PDF rendering share
  the exact same font/icon metrics. Keep the copies in lockstep.
- `server.js` waits for `document.fonts.ready` + explicit face loads before
  `page.pdf()`; `document.fonts.check()` verifies all three families loaded —
  failure throws instead of silently producing fallback glyphs.

## Environment

`.env` (gitignored) — template at `.env.example`:

```
PORT=5000
ALLOWED_ORIGINS=http://localhost:5173
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="...\n..."
```

`FIREBASE_PRIVATE_KEY` literal `\n` sequences are unescaped at startup; startup throws if credentials are missing.