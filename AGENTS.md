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

Each template has its own canonical stylesheet that serves as the **single source of truth** for visual styles:
- Classic: `vite-client/src/components/resumeBuilder/classic.css` ⇄ `server/templates/classic.css`
- Professional: `vite-client/src/components/resumeBuilder/professional.css` ⇄ `server/templates/professional.css`

The server inlines these files at runtime for PDF rendering. Keep the client and server copies byte-identical.

## Key Architecture (Frontend)

The resume builder uses a **multi-resume, multi-template adapter pattern**:

1. Routes: `/` (Dashboard — lists saved resumes, creates new resumes with selected template) and `/resumes/:resumeId/edit` (Resume Builder).
2. `ResumeContent` is portable across templates: templates decide presentation, but do not own or mutate content.
3. Templates registered in `templates.ts` (`classicTemplate`, `professionalTemplate`).
4. Template adapters (`classicAdapter.tsx`, `professionalAdapter.tsx`) produce layout blocks and render JSX.
5. `MeasuredResumePages` measures DOM block heights and runs `paginateLayout` to split content across A4 pages.
6. A `SerializedLayoutPlan` carrying `templateId` + `templateVersion` is sent to the server, which renders an identical HTML layout in Puppeteer.
7. Builder supports "Change Template" — switches template identity while preserving 100% of resume content and invalidating stale layout plans.

See `vite-client/AGENTS.md` for file-level details.

## Key Architecture (Backend)

Single-purpose Express server: PDF rendering via Puppeteer.

- **Endpoint**: `POST /api/resumes/:resumeId/pdf` — Bearer JWT auth, returns A4 PDF
- **Health check**: `GET /health`
- The client sends a measured `layoutPlan`; the server renders exactly those blocks (it does **not** decide pagination).
- `server/templates/registry.js` maps `(templateId, templateVersion)` → renderer. Registered templates: `classic` v1 (`templates/classic.js`), `professional` v1 (`templates/professional.js`).
- Input validation (`server/validation.js`): resume shape, layout-plan shape, template/version match, URL schemes (http/https only), size limits → `422`.
- Vendored local assets: FontAwesome 6.5.1 (`server/assets/fontawesome/`) + Inter font (`server/assets/fonts/`) — the PDF path has no external CDN dependency. `server/fontAssets.js` embeds fonts as `data:` URLs at startup (no HTTP fetch for fonts); Puppeteer's SSRF guard continues to block all non-localhost/non-data network requests. The browser uses byte-identical copies under `vite-client/public/fontawesome/` and `vite-client/public/fonts/` (loaded from `index.html`) so measurement and PDF share the same font/icon metrics.

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
