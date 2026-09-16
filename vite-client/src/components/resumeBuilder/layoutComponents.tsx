import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

import { flattenLayoutBlocks, paginateLayout, serializeLayoutPlan, type LayoutBlock, type LayoutRegion, type PageDefinition, type PaginatedPage, type SerializedLayoutPlan } from './layout';
import { diagnosticsRoot, logFontDiagnostics, logIconDiagnostics, logLayoutDiagnostics } from './layoutDiagnostics';

export interface ResumePageProps {
  page: PageDefinition;
  children: ReactNode;
}

export const ResumePage = ({ page, children }: ResumePageProps) => {
  const style: CSSProperties = {
    width: `${page.width}px`,
    minHeight: `${page.height}px`,
    padding: `${page.padding.top}px ${page.padding.right}px ${page.padding.bottom}px ${page.padding.left}px`,
    boxSizing: 'border-box',
  };

  return <div className="resumePage" style={style}>{children}</div>;
};

export const ResumeRegion = ({ id, children }: { id: string; children: ReactNode }) => (
  <div className="resumeRegion" data-region-id={id}>{children}</div>
);

interface MeasuredResumePagesProps {
  page: PageDefinition;
  regions: LayoutRegion<ReactNode>[];
  renderPage: (page: PaginatedPage<ReactNode>) => ReactNode;
  onLayoutPlanChange?: (plan: SerializedLayoutPlan) => void;
  planMetadata?: Pick<SerializedLayoutPlan, 'templateId' | 'templateVersion'>;
}

export const MeasuredResumePages = ({ page, regions, renderPage, onLayoutPlanChange, planMetadata }: MeasuredResumePagesProps) => {
  const measureRef = useRef<HTMLDivElement | null>(null);
  const measuredSignatureRef = useRef('');
  const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>({});
  const [measuredHeaderHeight, setMeasuredHeaderHeight] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);

  // Font-loading barrier (plan §11): the layout engine measures DOM height and
  // uses it for pagination. If fallback fonts (Arial) are active while Inter /
  // Font Awesome still load, line wrapping and icon box metrics differ, which
  // silently changes pagination vs. the PDF. Never measure while fonts are
  // still loading. `document.fonts.ready` resolves when ALL pending @font-face
  // loads settle, so once it fires we know Inter and FA are active (they are
  // local assets loaded from index.html, so they are already requested before
  // this component mounts).
  useLayoutEffect(() => {
    if (fontsReady) return;
    let cancelled = false;
    let ready: Promise<unknown> = Promise.resolve();
    if (typeof document !== 'undefined' && 'fonts' in document) {
      ready = document.fonts.ready.then(() => {
        // Extra safety: also verify the two families the resume depends on
        // before declaring readiness (document.fonts.ready can resolve even
        // when a specific face failed).
        return Promise.all([
          document.fonts.load('16px Inter').catch(() => undefined),
          document.fonts.load('16px "Font Awesome 6 Free"').catch(() => undefined),
          document.fonts.load('16px "Font Awesome 6 Brands"').catch(() => undefined),
        ]).then(() => undefined);
      });
    }
    ready.then(() => {
      if (!cancelled) setFontsReady(true);
    });
    return () => { cancelled = true; };
  }, [fontsReady]);

  useLayoutEffect(() => {
    if (!fontsReady) return;
    const measureElement = measureRef.current;
    if (!measureElement) return;

    // Measure the header block (always rendered on page 0, outside regions)
    const headerEl = measureElement.querySelector<HTMLElement>('[data-layout-block="header"]');
    const hHeight = headerEl ? Math.ceil(headerEl.getBoundingClientRect().height) : 0;

    const nextHeights = regions.flatMap((region) => flattenLayoutBlocks(region.blocks).map((block) => {
      const blockElement = measureElement.querySelector<HTMLElement>(`[data-layout-block="${block.id}"]`);
      return [`${region.id}:${block.id}`, blockElement?.getBoundingClientRect().height ?? 0] as const;
    }));

    const measuredSignature = `${hHeight}|` + nextHeights
      .map(([key, height]) => `${key}:${height}`)
      .join('|');

    if (measuredSignature !== measuredSignatureRef.current) {
      measuredSignatureRef.current = measuredSignature;
      setMeasuredHeaderHeight(hHeight);
      setMeasuredHeights(Object.fromEntries(nextHeights));
    }
  }, [regions, fontsReady]);

  const applyMeasuredHeights = (block: LayoutBlock<ReactNode>, regionId: string): LayoutBlock<ReactNode> => ({
    ...block,
    height: measuredHeights[`${regionId}:${block.id}`] ?? block.height,
    children: block.children?.map((child) => applyMeasuredHeights(child, regionId)),
    parts: block.parts?.map((part) => applyMeasuredHeights(part, regionId)),
  });

  const measuredRegions = regions.map((region) => ({
    ...region,
    blocks: region.blocks.map((block) => applyMeasuredHeights(block, region.id)),
  }));
  const layoutPages = paginateLayout({ page, headerHeight: measuredHeaderHeight, regions: measuredRegions });

  const lastPlanSignatureRef = useRef('');

  useLayoutEffect(() => {
    if (!onLayoutPlanChange) return;
    const plan = serializeLayoutPlan({ page, regions: measuredRegions }, layoutPages, planMetadata);
    const planSignature = JSON.stringify(plan);
    if (planSignature !== lastPlanSignatureRef.current) {
      lastPlanSignatureRef.current = planSignature;
      onLayoutPlanChange(plan);
    }
  }, [layoutPages, page, measuredHeights, measuredRegions, onLayoutPlanChange, planMetadata]);

  // ── TEMPORARY parity diagnostics (plan Phase 5; remove when solved) ────────
  useLayoutEffect(() => {
    if (!fontsReady || Object.keys(measuredHeights).length === 0) return;
    const rootEl = diagnosticsRoot();
    logFontDiagnostics(rootEl);
    logIconDiagnostics(rootEl);
    for (const region of regions) {
      logLayoutDiagnostics(page, measuredHeaderHeight, layoutPages, region.id);
    }
  }, [fontsReady, measuredHeights, measuredHeaderHeight, layoutPages, regions, page]);

  return (
    <>
      <div ref={measureRef} className="resumeMeasureLayer" aria-hidden="true">
        {renderPage({ index: 0, regions: regions.map((region) => ({ id: region.id, blocks: region.blocks, overflowedBlockIds: [] })) })}
      </div>
      <div className="resumeDocument">
        {layoutPages.map((layoutPage) => (
          <div className="resumeRenderedPage" key={layoutPage.index}>
            <div className="resumePageLabel" aria-hidden="true">Page {layoutPage.index + 1} of {layoutPages.length}</div>
            {renderPage(layoutPage)}
          </div>
        ))}
      </div>
    </>
  );
};

