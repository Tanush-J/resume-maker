/**
 * Layout contract + pagination engine.
 *
 * ARCHITECTURE NOTE (transitional):
 * These types and the paginator are the current layout authority for the
 * editor canvas AND for the Puppeteer PDF (via `SerializedLayoutPlan`).
 *
 * The long-term design (see `templates.ts` adapter registry and
 * `classicAdapter.tsx`) is:
 *   - Each template adapter owns semantic layout *nodes* and page *rendering*.
 *   - This module owns only the *generic* pagination algorithm over nodes.
 *
 * Keep these interfaces stable; they are serialized between the browser and
 * the server.  Do NOT remove `children`, `splitStrategy`, `continuation`, or
 * `SerializedLayoutPlan` — they underpin the page-splitting engine.
 */

export type LayoutRegionFlow = 'vertical' | 'grid' | 'freeform';

export interface PageDefinition {
  width: number;
  height: number;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * Explicit continuation metadata carried by a `-continuation` layout block.
 *
 * The server renderer MUST NOT infer the continued section from the block id
 * (string sniffing); it reads this metadata. It is also serialized into the
 * `SerializedLayoutPlan` so the Puppeteer renderer can reproduce the exact
 * same continuation heading the browser measured.
 */
export interface ContinuationMetadata {
  /** Canonical section id (e.g. 'experience', 'projects', 'education'). */
  sectionId: string;
  /** Full heading text incl. suffix, e.g. 'Experience (continued)'. */
  title: string;
}

export interface LayoutBlock<T = unknown> {
  id: string;
  sourceId?: string;
  regionId: string;
  content: T;
  children?: LayoutBlock<T>[];
  parts?: LayoutBlock<T>[];
  height?: number;
  top?: number;
  bottom?: number;
  /** Flow consumed before this block begins on the current page/region. */
  flowBefore?: number;
  regionTop?: number;
  marginTop?: number;
  marginBottom?: number;
  keepTogether?: boolean;
  /** Allow the block's children to be split onto multiple pages (block itself is a grouping, not atomic). */
  allowSplit?: boolean;
  canSplit?: boolean;
  splitStrategy?: 'children' | 'none';
  /** React node rendered as a continuation block when this block breaks a page. */
  continuation?: T;
  /** Explicit continuation identity — avoid string sniffing on the server. */
  continuationMetadata?: ContinuationMetadata;
  /** Never leave this block as the last block of a page when content follows. */
  keepWithNext?: boolean;
  breakBefore?: boolean;
}

export interface LayoutRegion<T = unknown> {
  id: string;
  flow: LayoutRegionFlow;
  blocks: LayoutBlock<T>[];
}

export interface LayoutDocument<T = unknown> {
  page: PageDefinition;
  headerHeight?: number;
  regions: LayoutRegion<T>[];
}

export interface PaginatedRegion<T = unknown> {
  id: string;
  blocks: LayoutBlock<T>[];
  overflowedBlockIds: string[];
}

export interface PaginatedPage<T = unknown> {
  index: number;
  regions: PaginatedRegion<T>[];
}

export interface SerializedLayoutBlock {
  id: string;
  sourceId?: string;
  height: number;
  isContinuation?: boolean;
  continuationMetadata?: ContinuationMetadata;
}

export interface SerializedLayoutRegion {
  id: string;
  blocks: SerializedLayoutBlock[];
  overflowedBlockIds: string[];
}

export interface SerializedLayoutPlan {
  templateId?: string;
  templateVersion?: number;
  page: PageDefinition;
  pages: Array<{
    index: number;
    regions: SerializedLayoutRegion[];
  }>;
}

const getUsableHeight = (page: PageDefinition) =>
  page.height - page.padding.top - page.padding.bottom;

const getChildren = <T>(block: LayoutBlock<T>) => block.children ?? block.parts;

const expandSplittableBlock = <T>(block: LayoutBlock<T>): LayoutBlock<T>[] => {
  const children = getChildren(block);
  if (!children?.length || block.canSplit === false || block.splitStrategy === 'none') {
    return [block];
  }

  return children.flatMap(expandSplittableBlock);
};

export const flattenLayoutBlocks = <T>(blocks: LayoutBlock<T>[]) =>
  blocks.flatMap(expandSplittableBlock);

export const paginateLayout = <T>(
  layout: LayoutDocument<T>,
  measuredHeights: Record<string, number> = {},
): PaginatedPage<T>[] => {
  const usableHeight = getUsableHeight(layout.page);
  const headerHeight = layout.headerHeight ?? 0;
  const budgetFor = (pageIndex: number) =>
    pageIndex === 0 ? Math.max(0, usableHeight - headerHeight) : usableHeight;

  const measuredHeightOf = (block: LayoutBlock<T>): number => {
    const key = `${block.regionId}:${block.id}`;
    const measured = measuredHeights[key];
    if (typeof measured === 'number' && Number.isFinite(measured)) {
      return measured;
    }
    return block.height ?? 0;
  };

  const flowHeightOf = (block: LayoutBlock<T>): number => {
    if (typeof block.top === 'number' && typeof block.bottom === 'number' && block.bottom >= block.top) {
      return block.bottom - block.top;
    }
    if (block.children?.length) {
      return block.children.reduce((sum, child) => sum + flowHeightOf(child), 0);
    }
    return measuredHeightOf(block);
  };

  const derivedFlowBefore = (
    block: LayoutBlock<T>,
    _previousBlock?: LayoutBlock<T>,
    _regionTop = 0,
  ): number => {
    // Page-local flow is tracked by the paginator itself (`pageCursor`), not by
    // reusing original browser DOM coordinates. The measured `top`/`bottom`
    // values are relative to the full unpaginated region, so they are not valid
    // once a block is assigned to a specific page.
    if (typeof block.flowBefore === 'number' && Number.isFinite(block.flowBefore)) {
      return Math.max(0, block.flowBefore);
    }
    return 0;
  };

  /**
   * Physical flow consumed by a block. Prefer the browser's actual top/bottom
   * geometry. Only fall back to summing child flow when a measured container
   * bounds are unavailable.
   */
  const heightOf = (block: LayoutBlock<T>): number => flowHeightOf(block);

  const paginatedRegions = layout.regions.map((region) => {
    const pages: LayoutBlock<T>[][] = [[]];
    const overflowedBlockIds: string[] = [];
    let pageIndex = 0;
    let pageCursor = 0;
    /**
     * Nearest splittable container that carries `continuationMetadata` while
     * placing its subtree — i.e. the section whose continuation heading should
     * appear when a page break happens inside it. Once a page break happens
     * inside the section, the section spans pages, and every following page
     * that continues it gets exactly one continuation heading.
     */
    let continuationOwner: LayoutBlock<T> | null = null;
    /** Section already continued on the current page (one heading per page). */
    let continuedSectionId: string | null = null;
    /**
     * True when at least one page break has occurred inside the current
     * continuation owner — i.e. the section genuinely spans pages.
     */
    let ownerBroke = false;

    const ensurePage = () => {
      pageIndex += 1;
      if (pages[pageIndex] === undefined) pages.push([]);
      pageCursor = 0;
      continuedSectionId = null;
    };

    /**
     * Emit the continuation heading for the current section at the top of the
     * CURRENT page. Uses explicit `continuationMetadata` — never infers the
     * section from the block id. Only fires once per page and only when the
     * section genuinely spans pages.
     */
    const pushContinuationHeading = () => {
      const owner = continuationOwner;
      const meta = owner?.continuationMetadata;
      if (!meta || !owner) return;
      if (!ownerBroke) return;
      if (continuedSectionId === meta.sectionId) return;
      continuedSectionId = meta.sectionId;
      const continuationId = `${owner.id}-continuation`;
      const continuationBlock: LayoutBlock<T> = {
        id: continuationId,
        sourceId: owner.sourceId ?? owner.id,
        regionId: owner.regionId,
        content: owner.continuation as T,
        height: measuredHeights[`${owner.regionId}:${continuationId}`] ?? owner.height ?? 0,
        flowBefore: 0,
        keepTogether: true,
        splitStrategy: 'none',
        continuationMetadata: meta,
      };
      pages[pageIndex].push(continuationBlock);
      pageCursor += heightOf(continuationBlock);
    };

    const placeBlock = (block: LayoutBlock<T>, nextBlock?: LayoutBlock<T>): void => {
      const budget = budgetFor(pageIndex);
      const height = heightOf(block);
      const hasChildren = Boolean(block.children?.length);
      const previousOnPage = pages[pageIndex].at(-1) ?? undefined;
      const blockFlowBefore = derivedFlowBefore(block, previousOnPage, 0);
      const blockCost = blockFlowBefore + height;

      if (block.keepWithNext && nextBlock && pageCursor > 0) {
        const nextFlowBefore = derivedFlowBefore(nextBlock, block, 0);
        const nextBlockCost = nextFlowBefore + heightOf(nextBlock);
        const combined = blockCost + nextBlockCost;
        if (pageCursor + combined > budget && pageCursor + blockCost <= budget) {
          ownerBroke = true;
          ensurePage();
          pushContinuationHeading();
        }
      }

      if (pageCursor > 0 && pageCursor + blockCost > budget) {
        if (pageCursor > 0) {
          ownerBroke = true;
          ensurePage();
          pushContinuationHeading();
        }
      }

      if (pageCursor === 0 && blockCost > budget) {
        overflowedBlockIds.push(block.id);
      }

      if (block.breakBefore && pageCursor > 0) {
        ownerBroke = true;
        ensurePage();
        pushContinuationHeading();
      }

      const currentPageHasContent = pages[pageIndex].length > 0;
      if (currentPageHasContent && pageCursor + blockCost > budget) {
        if (pageCursor > 0) {
          ownerBroke = true;
          ensurePage();
          pushContinuationHeading();
        }
      }

      // ── Leaf: atomic unit (heading, bullet, sidebar item, skills) ──
      if (!hasChildren) {
        if (pageCursor + blockCost > budget && pageCursor === 0) {
          overflowedBlockIds.push(block.id);
        }
        pages[pageIndex].push(block);
        pageCursor += blockCost;
        return;
      }

      // ── Atomic container: entire group stays on one page ──
      if (!block.allowSplit) {
        if (pageCursor + blockCost > budget && pageCursor === 0) {
          overflowedBlockIds.push(block.id);
        }
        pages[pageIndex].push(block);
        pageCursor += blockCost;
        return;
      }

      // ── Splittable container: children flow across pages — the semantic
      //    nucleus of the paginator. Sections (continuation owners) and
      //    experience/project items are modeled this way, so item headers
      //    stay with their first bullet and bullets keep flowing naturally.
      const previousOwner = continuationOwner;
      const previousOwnerBroke = ownerBroke;
      if (block.continuationMetadata) {
        continuationOwner = block;
        ownerBroke = false;
      }

      const children = block.children ?? [];
      for (let i = 0; i < children.length; i++) {
        placeBlock(children[i], children[i + 1]);
      }

      continuationOwner = previousOwner;
      ownerBroke = previousOwnerBroke;
    };

    for (let i = 0; i < region.blocks.length; i++) {
      placeBlock(region.blocks[i], region.blocks[i + 1]);
    }

    return { id: region.id, pages, overflowedBlockIds };
  });

  const pageCount = Math.max(...paginatedRegions.map((region) => region.pages.length), 1);

  return Array.from({ length: pageCount }, (_, index) => ({
    index,
    regions: paginatedRegions.map((region) => ({
      id: region.id,
      blocks: region.pages[index] ?? [],
      overflowedBlockIds: region.overflowedBlockIds,
    })),
  }));
};

export const serializeLayoutPlan = <T>(
  layout: LayoutDocument<T>,
  pages: PaginatedPage<T>[],
  metadata?: Pick<SerializedLayoutPlan, 'templateId' | 'templateVersion'>,
): SerializedLayoutPlan => ({
  ...metadata,
  page: layout.page,
  pages: pages.map((page) => ({
    index: page.index,
    regions: page.regions.map((region) => ({
      id: region.id,
        blocks: region.blocks.map((block) => ({
        id: block.id,
        sourceId: block.sourceId,
        height: block.height ?? 0,
        isContinuation: block.id.endsWith('-continuation'),
        continuationMetadata: block.continuationMetadata,
      })),
      overflowedBlockIds: region.overflowedBlockIds,
    })),
  })),
});