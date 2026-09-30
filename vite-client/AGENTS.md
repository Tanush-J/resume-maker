# AGENTS.md — `vite-client/` (Active Frontend)

## Stack

React 19 + TypeScript 5.8 + Vite 7 · Redux Toolkit + react-redux · react-router-dom v7 · Firebase v11 (auth + Firestore) · Ant Design v5 (UI) · @dnd-kit (drag-and-drop). Toast feedback uses Ant Design `message`, not react-toastify.

## Key Files

| File | Purpose |
|---|---|
| `src/main.tsx` | React entry; mounts `<App/>` inside Redux `<Provider>` inside antd `<ConfigProvider>` + `<App>` (context-aware `message`/`notification`/`modal`) |
| `src/App.tsx` | Routing shell (`/` Dashboard, `/resumes/:resumeId/edit` BuildResume, `/signin`, `/signup`); restores auth from localStorage on mount |
| `src/firebase.ts` | Firebase init; hardcoded config (`projectId: resumemaker-5782f`); exports `auth`, `db` |
| `src/theme.ts` | antd `ThemeConfig` (blue accent `#1e90ff`, Inter font family, button/modal card radii) |
| `src/pages/home/dashboard.tsx` | Dashboard landing page — lists user resumes, opens builder, template-picker modal for creating new resumes |
| `src/components/resumeBuilder/resumeModel.ts` | Domain types + `defaultResumeContent` / `createDefaultResume` factory; `SECTION_RECORDS`, `createEmptySectionItem` (no React/JSX here); supports `summary` and `header.title` |
| `src/components/resumeBuilder/templates.ts` | Template registry, adapter interface (`createHeaderBlock`, `createLayoutRegions`, `renderPage`), `classicTemplate`, `professionalTemplate`, `listTemplates` |
| `src/components/resumeBuilder/layout.ts` | Pure pagination engine (`paginateLayout`, `serializeLayoutPlan`) — framework-agnostic; `ContinuationMetadata` + semantic containers (`allowSplit`, `keepWithNext`) |
| `src/components/resumeBuilder/layoutComponents.tsx` | `MeasuredResumePages` — DOM measurement + paginated rendering |
| `src/components/resumeBuilder/classicAdapter.tsx` | Classic template adapter; self-registers via `registerTemplateAdapter`; imports `classic.css`; builds semantic blocks |
| `src/components/resumeBuilder/professionalAdapter.tsx` | Professional template adapter; single-column, centered header; self-registers via `registerTemplateAdapter` |
| `src/components/resumeBuilder/mainResume.tsx` | Editor orchestrator; resolves adapter by `templateId`; delegates header + regions + page rendering to adapter |
| `src/components/resumeBuilder/buildResume.tsx` | Page container; owns resume state; loads resume by route `resumeId`; Change Template modal; PDF generation + preview modal; section controls with @dnd-kit |
| `src/components/resumeBuilder/resumeEditorPopover.tsx` | Edit modal for a selection (header, summary, experience, project, skill, social, education, training, achievement) |
| `src/components/resumeBuilder/resumeRepository.ts` | Multi-resume Firestore repository (`getResume`, `listResumes`, `createResume`, `saveResume`, `deleteResume`) + legacy v1→v2 migration |
| `src/components/resumeBuilder/pdfService.ts` | POSTs resume + layout plan to server (`VITE_API_URL` or `http://localhost:5000`); returns PDF blob |
| `src/components/resumeBuilder/classic.css` | Canonical styles for Classic template (synced with server/templates/classic.css) |
| `src/components/resumeBuilder/professional.css` | Canonical styles for Professional template (synced with server/templates/professional.css) |
| `src/components/editableTags/` | `contentEditable` primitives (`EditableText`, `EditableLink`, `EditableTagWithChildren`) |
| `src/redux/` | `authSlice`, `loadingSlice`, `store.ts` (exports `RootState`) |

## Conventions

- **Auth is localStorage-driven**, not Redux-subscribed: key `yourpholio` holds `{ uid }`. `App.tsx`, `Navbar`, and `ProtectedRoutes` all read it directly.
- Store only cross-cutting boolean flags (`auth`, `loading`) in Redux; resume editing lives in component state.
- Immutable edits via `structuredClone(resume)` + dot-path writes through `onChange(path, value)` passed down from `BuildResume` → adapter → edit primitives.
- CSS Modules (`.module.css`) for component shells; **shared resume visual styles in `classic.css` and `professional.css`** (server depends on them).
- `pages/home/` contains `dashboard.tsx` (landing page at `/`).
- TypeScript is strict (`noUnusedLocals`, `noUnusedParameters`); build runs `tsc -b` so type errors fail the build.

## Layout semantics (do not regress)

- The client layout engine is the **single pagination authority**. `MeasuredResumePages` measures real DOM, `paginateLayout` decides pages/blocks, and the serialized `SerializedLayoutPlan` is sent to the server, which renders exactly those blocks.
- **Semantic blocks**: experience/project items use `${itemId}-head` (header + first bullet, atomic) + `${itemId}-bullet-N` (flowing bullets). Section headings use `keepWithNext` so they never strand at a page bottom.
- **Continuation metadata**: continuation blocks carry explicit `continuationMetadata: { sectionId, title }` — the server never infers the continued section from block ids. Block ids ending in `-continuation` and the legacy id-sniffing in `server/templates/classic.js` exist only as a transitional fallback.
- **Fonts**: `classic.css` uses `Inter`. The browser loads **vendored local copies** (`public/fonts/inter.css` + `public/fontawesome/`) identical to the server's copies under `server/assets/` — the measurement layer and Puppeteer use the exact same font/icon files (pagination parity). Do not change one copy without the other. No Google Fonts / FA Kit CDN in the resume path.

## Do Not

- Do not add section JSX to `mainResume.tsx` — new templates are new adapter modules (register + define `createLayoutRegions`/`renderPage`) registered in `templates.ts`.
- Do not duplicate resume visual styles in component CSS — edit `classic.css` instead.
- Do not import from `../client` or reference the legacy app.