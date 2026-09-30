import type { ReactNode } from 'react';
import type { ResumeDocument, ResumeSectionId } from './resumeModel';
import type { LayoutBlock, LayoutRegion, PageDefinition, PaginatedPage } from './layout';
import type { EditorSelection } from './resumeEditorPopover';

// ─── Template definition ──────────────────────────────────────────────────────

export interface ResumeTemplateDefinition {
  id: string;
  version: number;
  name: string;
  supportedSections: ResumeSectionId[];
  page: PageDefinition;
  regions: Array<{
    id: string;
    flow: 'vertical' | 'grid' | 'freeform';
  }>;
  /**
   * Placeholder metadata for the dashboard / template picker. Real rendered
   * thumbnails are intentionally out of scope — a card shows the name.
   */
  preview?: {
    type: 'placeholder';
    label?: string;
  };
}

// ─── Editor callbacks passed from BuildResume → adapter ──────────────────────

export interface TemplateAdapterCallbacks {
  /** Update a single scalar value at a dot-separated path inside `resume.content`. */
  onChange: (path: string, value: string) => void;
  /** Open the side popover for the given selection. */
  onSelectEditor?: (selection: EditorSelection) => void;
}

// ─── Adapter interface ────────────────────────────────────────────────────────

/**
 * A template adapter owns:
 *  - How `ResumeDocument` is translated into layout nodes (data → structure).
 *  - How a paginated page is rendered as React JSX (structure → pixels).
 *
 * `BuildResume` and `mainResume` never inspect the JSX produced here; they
 * only hold the adapter reference and pass it through to `MeasuredResumePages`.
 */
export interface ResumeTemplateAdapter {
  readonly definition: ResumeTemplateDefinition;

  /**
   * Build the header layout block for the template. The header is
   * template-owned (Classic = left-aligned contact row; Professional =
   * centered name + title). Measured by `MeasuredResumePages` via
   * `[data-layout-block="header"]` and rendered on page 0.
   */
  createHeaderBlock(
    resume: ResumeDocument,
    callbacks: TemplateAdapterCallbacks,
  ): LayoutBlock<ReactNode>;

  /**
   * Convert a resume document into a list of layout regions ready for
   * measurement and pagination.  Must be a pure function of `resume` and `callbacks`.
   */
  createLayoutRegions(
    resume: ResumeDocument,
    callbacks: TemplateAdapterCallbacks,
  ): LayoutRegion<ReactNode>[];

  /**
   * Render a single paginated page (with its measured/paginated regions) as
   * React elements.  The header block is provided separately so adapters can
   * decide where it lives on page 0 vs continuation pages.
   */
  renderPage(
    page: PaginatedPage<ReactNode>,
    headerBlock: LayoutBlock<ReactNode> | null,
  ): ReactNode;
}

// ─── Classic template definition ─────────────────────────────────────────────

export const classicTemplate: ResumeTemplateDefinition = {
  id: 'classic',
  version: 1,
  name: 'Classic Resume',
  supportedSections: [
    'summary',
    'experience',
    'projects',
    'skills',
    'social',
    'education',
    'trainingCourses',
    'achievements',
  ],
  preview: { type: 'placeholder', label: 'Classic Resume' },
  page: {
    width: 794,
    height: 1123,
    padding: { top: 60, right: 60, bottom: 0, left: 60 },
  },
  regions: [
    { id: 'main', flow: 'vertical' },
    { id: 'sidebar', flow: 'vertical' },
  ],
};

// ─── Professional template definition ────────────────────────────────────────

export const professionalTemplate: ResumeTemplateDefinition = {
  id: 'professional',
  version: 1,
  name: 'Professional',
  supportedSections: [
    'summary',
    'experience',
    'projects',
    'skills',
    'social',
    'education',
    'trainingCourses',
    'achievements',
  ],
  preview: { type: 'placeholder', label: 'Professional' },
  page: {
    width: 794,
    height: 1123,
    padding: { top: 60, right: 60, bottom: 0, left: 60 },
  },
  regions: [
    { id: 'main', flow: 'vertical' },
  ],
};

// ─── Registry ─────────────────────────────────────────────────────────────────

/** Keyed by template id → adapter instance. Populated by each adapter module. */
const adapterRegistry: Record<string, ResumeTemplateAdapter> = {};

export const registerTemplateAdapter = (adapter: ResumeTemplateAdapter): void => {
  adapterRegistry[adapter.definition.id] = adapter;
};

export const getTemplateAdapter = (templateId: string): ResumeTemplateAdapter => {
  const adapter = adapterRegistry[templateId];
  if (!adapter) {
    throw new Error(`No adapter registered for template: "${templateId}". Did you import the adapter module?`);
  }
  return adapter;
};

/** Non-throwing lookup — UI can show a useful error instead of crashing. */
export const getTemplateAdapterSafe = (templateId: string): ResumeTemplateAdapter | null =>
  adapterRegistry[templateId] ?? null;

/** Enumerate all registered adapters (dashboard + picker + renderer). */
export const listTemplateAdapters = (): ResumeTemplateAdapter[] =>
  Object.values(adapterRegistry);

/** Enumerate all registered template definitions. */
export const listTemplates = (): ResumeTemplateDefinition[] =>
  Object.values(adapterRegistry).map((adapter) => adapter.definition);