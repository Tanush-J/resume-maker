/**
 * TEMPORARY rendering-parity diagnostics (plan §13, §14, §17, §18, §42).
 *
 * These helpers log block heights, page budgets, remaining whitespace and
 * font/icon state so the browser preview can be compared against the PDF.
 * They are DEV-only (no-op outside `vite dev`) and should be REMOVED or
 * disabled once the parity investigation is complete (plan Phase 9).
 *
 * Do not change any pagination logic here — this module only observes.
 */

import type { LayoutBlock, PageDefinition, PaginatedPage } from './layout';

const enabled = (): boolean => {
  try {
    return import.meta.env.DEV === true;
  } catch {
    return false;
  }
};

/** @returns measured usable height (content box) for a page definition. */
const usableHeightOf = (page: PageDefinition): number =>
  page.height - page.padding.top - page.padding.bottom;

/**
 * §17/§18 — per-page block usage + remaining whitespace, computed from the
 * DOM-measured heights the paginator actually used (identical to the numbers
 * that produced the serialized LayoutPlan).
 */
export const logLayoutDiagnostics = (
  page: PageDefinition,
  headerHeight: number,
  paginated: PaginatedPage<unknown>[],
  regionId: string,
): void => {
  if (!enabled()) return;

  const usableHeight = usableHeightOf(page);
  const budgetFor = (pageIndex: number) =>
    pageIndex === 0 ? Math.max(100, usableHeight - headerHeight) : usableHeight;

  for (const p of paginated) {
    const region = p.regions.find((r) => r.id === regionId);
    if (!region) continue;
    const budget = budgetFor(p.index);
    const used = region.blocks.reduce((sum, b) => sum + (b.height ?? 0), 0);
    const lastContentBottom = page.padding.top + (p.index === 0 ? headerHeight : 0) + used;
    const remainingWhitespace = page.height - lastContentBottom;

    console.log(
      `[parity] page=${p.index} region=${region.id} usable=${usableHeight} header=${p.index === 0 ? headerHeight : 0} budget=${budget} used=${used} lastContentBottom=${lastContentBottom} remainingWhitespace=${remainingWhitespace}`,
    );
    for (const b of region.blocks) {
      console.log(
        `[parity]   ${b.id} src=${b.sourceId ?? '-'} h=${b.height ?? 0}${b.id.endsWith('-continuation') ? ' CONT' : ''}`,
      );
    }
  }
};

/** §13 — computed font state for representative resume elements. */
export const logFontDiagnostics = (root: HTMLElement | null): void => {
  if (!enabled() || !root) return;
  if (typeof document === 'undefined' || !document.fonts) return;

  const sample = (selector: string, label: string): void => {
    const el = root.querySelector<HTMLElement>(selector);
    if (!el) return;
    const cs = getComputedStyle(el);
    console.log(
      `[parity] font ${label} -> "${cs.fontFamily}" w=${cs.fontWeight} style=${cs.fontStyle} size=${cs.fontSize}`,
    );
  };

  sample('.resumeHeader h1', 'name');
  sample('.sectionHeading h2', 'sectionHeading');
  sample('.itemObject h3', 'itemHeading');
  sample('.itemObject li', 'bullet');
  sample('.contactInfo span', 'metadata');
  sample('.socialIconContainer p', 'sidebarText');

  console.log('[parity] fonts.status =', document.fonts.status);
  console.log('[parity] fonts.check("16px Inter") =', document.fonts.check('16px Inter'));
  console.log(
    '[parity] fonts.check("16px \\"Font Awesome 6 Free\\"") =',
    document.fonts.check('16px "Font Awesome 6 Free"'),
  );
  console.log(
    '[parity] fonts.check("16px \\"Font Awesome 6 Brands\\"") =',
    document.fonts.check('16px "Font Awesome 6 Brands"'),
  );
};

/** §14 — computed icon state: class, active font family/weight, ::before content. */
export const logIconDiagnostics = (root: HTMLElement | null): void => {
  if (!enabled() || !root) return;

  const icons = Array.from(root.querySelectorAll<HTMLElement>('i.fa-solid, i.fa-brands, i.fa-regular'));
  for (const icon of icons.slice(0, 12)) {
    const cs = getComputedStyle(icon);
    const before = getComputedStyle(icon, '::before');
    console.log(
      `[parity] icon "${icon.className}" font="${cs.fontFamily}" w=${cs.fontWeight} content="${before.content}"`,
    );
  }
};

/** Drain the measured tree for the diagnostic helpers above. */
export const diagnosticsRoot = (): HTMLElement | null =>
  typeof document !== 'undefined'
    ? document.querySelector<HTMLElement>('.resumeMeasureLayer')
    : null;

// Re-exported only so the type import stays consistent with layout.ts usage.
export type { LayoutBlock };