# AGENTS.md

## Active Project Areas

- `vite-client/` — active frontend. All frontend changes go here.
- `server/` — active backend/PDF renderer. All backend changes go here.
- `client/` — FROZEN LEGACY CRA APP. Do not read, modify, search, or use as a reference unless explicitly requested.

### HARD RULES

- **Never** read, modify, search, or reference `client/`. It is a frozen Create React App rewrite of the same features on an older stack (React 18, firebase v10, react-scripts 5). It exists only for historical reference and must never be traversed by agents.
- **Always** put frontend changes in `vite-client/`.
- **Always** put backend changes in `server/`.
- `client/` is the **only** directory with this restriction. `vite-client/` and `server/` are fully read/write.

## Commands

| App | Command | Notes |
|---|---|---|
| Frontend (`vite-client/`) | `npm run dev` | Vite dev server, default port 5173 |
| Frontend (`vite-client/`) | `npm run build` | `tsc -b && vite build` — type-checks then bundles |
| Frontend (`vite-client/`) | `npm run lint` | ESLint (flat config) |
| Backend (`server/`) | `npm start` | `node server.js`, default port 5000 |
| Backend (`server/`) | `npm test` | `node --test "test/**/*.test.js"` — PDF font regression tests |

Both apps require `npm install` from their respective directories on first setup.

## Shared CSS Contract

`vite-client/src/components/resumeBuilder/classic.css` is the **single source of truth** for all visual resume styles. The server reads and inlines this file at runtime for PDF rendering. Do not duplicate resume visual styles elsewhere; edit them only in `classic.css`.

## Key Architecture (Frontend)

The resume builder uses a **template-adapter pattern**:

1. `ResumeContent` data is passed to an adapter (`classicAdapter.tsx`)
2. Adapter produces layout regions (list of blocks routed to `main`/`sidebar` columns)
3. `MeasuredResumePages` renders a hidden measurement layer, measures each block's actual height, then runs `paginateLayout` to split blocks across A4 pages
4. A `SerializedLayoutPlan` is sent to the server, which renders an identical HTML layout in Puppeteer and returns a PDF blob

See `vite-client/AGENTS.md` for file-level details.

## Key Architecture (Backend)

Single-purpose Express server: PDF rendering via Puppeteer.

- **Endpoint**: `POST /api/resumes/:resumeId/pdf` — Bearer JWT auth, returns A4 PDF
- **Health check**: `GET /health`
- The client sends a measured `layoutPlan`; the server renders exactly those blocks (it does **not** decide pagination). `server/templates/classic.js` (reads `classic.css` via `fs.readFileSync`) is the `classic` v1 renderer, registered in `server/templates/registry.js`.
- Input validation (`server/validation.js`): resume shape, layout-plan shape, template/version match, URL schemes (http/https only), size limits → `422`.
- Vendored local assets: FontAwesome 6.5.1 (`server/assets/fontawesome/`) + Inter font (`server/assets/fonts/`) — the PDF path has no external CDN dependency. `server/fontAssets.js` embeds fonts as `data:` URLs at startup (no HTTP fetch for fonts); Puppeteer's SSRF guard continues to block all non-localhost/non-data network requests. The browser uses byte-identical copies under `vite-client/public/fontawesome/` and `vite-client/public/fonts/` (loaded from `index.html`) so measurement and PDF share the same font/icon metrics.
- Supports only `classic` template v1; adding a new template requires changes in both frontend (`vite-client/.../templates.ts` + new adapter module) and backend (`server/templates/registry.js` + new renderer).

See `server/AGENTS.md` for details.

## Environment

- Backend env vars documented in `server/.env.example` — required: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (startup fails fast if missing)
- Frontend env: optional `VITE_API_URL` (defaults to `http://localhost:5000`)

## AGENTS.md Maintenance

This file and the nested `AGENTS.md` files are the **single source of truth** for where agents should look. Keep them small and high-signal — they are instructions, not documentation.

**When adding a directory or subdirectory to the workspace:**

- **Active code** → add one line to `Active Project Areas` describing its purpose, and add its run/build/lint commands to the `Commands` table.
- **Frozen/legacy code** → mark it `FROZEN LEGACY — do not read, modify, search, or use as a reference unless explicitly requested.` and add it to `HARD RULES`.
- **Scratch/generated dirs** (`node_modules`, `dist`, build output, temp scripts) → **do not** list them here; that wastes agent tokens and invites traversal.
- **Moving, renaming, or deprecating** a directory → update this file in the **same change** as the move. Stale or missing paths here cause agents to look in the wrong place.

**Sub-directory AGENTS.md files:**

- `vite-client/AGENTS.md` and `server/AGENTS.md` already exist and hold app-level details (key files, conventions, do-not rules).
- Create a nested `AGENTS.md` **only** when a subdirectory is complex enough that agents would waste tokens rediscovering its architecture.
- Keep at most one level of nesting (root + app-level). Deeper nesting is rarely worth it — reference the subdirectory's key files from the nearest AGENTS.md instead.

**Editing rules:**

- Keep commands exact — copy them from `package.json` / `vite.config.ts`; never invent flags or ports.
- Update `Active Project Areas`, `Commands`, and `HARD RULES` together when the directory map changes.
