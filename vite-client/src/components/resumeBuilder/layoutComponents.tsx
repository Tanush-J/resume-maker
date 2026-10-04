import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

import { flattenLayoutBlocks, paginateLayout, serializeLayoutPlan, type LayoutBlock, type LayoutRegion, type PageDefinition, type PaginatedPage, type SerializedLayoutPlan } from './layout';
import type { ResumeDesignOverrides } from './resumeModel';
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
  designOverrides?: ResumeDesignOverrides;
}

export const MeasuredResumePages = ({ page, regions, renderPage, onLayoutPlanChange, planMetadata, designOverrides }: MeasuredResumePagesProps) => {
  const measureRef = useRef<HTMLDivElement | null>(null);
  const measuredSignatureRef = useRef('');
  const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>({});
  const [measuredGeometry, setMeasuredGeometry] = useState<Record<string, { top: number; bottom: number; height: number }>>({});
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

    const measureRegionBounds = (regionId: string) => {
      const regionEl = measureElement.querySelector<HTMLElement>(`[data-region-id="${regionId}"]`);
      const regionRect = regionEl?.getBoundingClientRect();
      return {
        top: regionRect ? regionRect.top : 0,
        bottom: regionRect ? regionRect.bottom : 0,
      };
    };

    // Measure the header block (always rendered on page 0, outside regions)
    const headerEl = measureElement.querySelector<HTMLElement>('[data-layout-block="header"]');
    const headerRect = headerEl?.getBoundingClientRect();
    const hHeight = headerEl && headerRect ? Math.ceil(headerRect.height) : 0;

    const nextEntries = regions.flatMap((region) => {
      const regionBounds = measureRegionBounds(region.id);
      const blockEntries = flattenLayoutBlocks(region.blocks).flatMap((block) => {
        const blockEl = measureElement.querySelector<HTMLElement>(`[data-layout-block="${block.id}"]`);
        const rect = blockEl?.getBoundingClientRect();
        const nextHeight = blockEl && rect ? Math.ceil(rect.height) : measuredHeights[`${region.id}:${block.id}`] ?? block.height ?? 0;
        const top = blockEl && rect ? rect.top - regionBounds.top : block.top ?? 0;
        const bottom = blockEl && rect ? rect.bottom - regionBounds.top : (block.top ?? 0) + nextHeight;

        const measurements: Array<readonly [string, { top: number; bottom: number; height: number }]> = [[`${region.id}:${block.id}`, { top, bottom, height: nextHeight }] as const];

        if (block.continuationMetadata) {
          const continuationId = `${block.id}-continuation`;
          const continuationEl = measureElement.querySelector<HTMLElement>(`[data-layout-block="${continuationId}"]`);
          const continuationRect = continuationEl?.getBoundingClientRect();
          const continuationHeight = continuationEl && continuationRect ? Math.ceil(continuationRect.height) : measuredHeights[`${region.id}:${continuationId}`] ?? block.height ?? 0;
          const continuationTop = continuationEl && continuationRect ? continuationRect.top - regionBounds.top : top;
          const continuationBottom = continuationEl && continuationRect ? continuationRect.bottom - regionBounds.top : continuationTop + continuationHeight;
          measurements.push([`${region.id}:${continuationId}`, { top: continuationTop, bottom: continuationBottom, height: continuationHeight }] as const);
        }

        return measurements;
      });

      return blockEntries;
    });

    const nextHeights: Record<string, number> = Object.fromEntries(nextEntries.map(([key, metrics]) => [key, metrics.height])) as Record<string, number>;
    const nextGeometry: Record<string, { top: number; bottom: number; height: number }> = Object.fromEntries(nextEntries.map(([key, metrics]) => [key, { top: metrics.top, bottom: metrics.bottom, height: metrics.height }])) as Record<string, { top: number; bottom: number; height: number }>;
    const measuredSignature = `${hHeight}|` + Object.entries(nextHeights)
      .map(([key, height]) => `${key}:${height}:${nextGeometry[key]?.top ?? 0}:${nextGeometry[key]?.bottom ?? 0}`)
      .join('|');

    if (measuredSignature !== measuredSignatureRef.current) {
      measuredSignatureRef.current = measuredSignature;
      setMeasuredHeaderHeight(hHeight);
      setMeasuredHeights(nextHeights);
      setMeasuredGeometry(nextGeometry);
    }
  }, [regions, fontsReady]);

  const applyMeasuredHeights = (block: LayoutBlock<ReactNode>, regionId: string): LayoutBlock<ReactNode> => {
    const geometry = measuredGeometry[`${regionId}:${block.id}`];
    const metrics = geometry ?? {
      top: block.top ?? 0,
      bottom: block.bottom ?? (block.top ?? 0) + (block.height ?? 0),
      height: block.height ?? measuredHeights[`${regionId}:${block.id}`] ?? 0,
    };
    const flowBefore = block.flowBefore ?? 0;

    return {
      ...block,
      height: metrics.height ?? block.height,
      top: block.top ?? metrics.top,
      bottom: block.bottom ?? metrics.bottom,
      flowBefore,
      children: block.children?.map((child) => applyMeasuredHeights(child, regionId)),
      parts: block.parts?.map((part) => applyMeasuredHeights(part, regionId)),
    };
  };

  const measuredRegions = regions.map((region) => ({
    ...region,
    blocks: region.blocks.map((block) => applyMeasuredHeights(block, region.id)),
  }));
  const layoutPages = paginateLayout({ page, headerHeight: measuredHeaderHeight, regions: measuredRegions }, measuredHeights);

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

  const designStyle = {
    ['--resume-page-padding-top' as string]: `${page.padding.top}px`,
    ['--resume-page-padding-horizontal' as string]: `${page.padding.left}px`,
    ['--resume-page-width' as string]: `${page.width}px`,
    ['--resume-page-height' as string]: `${page.height}px`,
    ['--resume-font-body' as string]: `'${designOverrides?.fontFamily ?? 'Inter'}', Arial, sans-serif`,
    ['--resume-font-size' as string]: `${designOverrides?.fontSize ?? 10}px`,
    ['--resume-line-height' as string]: String(designOverrides?.lineHeight ?? 1.2),
    ['--resume-space-section' as string]: `${designOverrides?.sectionSpacing ?? 14}px`,
    ['--resume-space-item' as string]: `${designOverrides?.itemSpacing ?? 8}px`,
    ['--resume-sidebar-width' as string]: `${designOverrides?.sidebarWidth ?? 40}%`,
    ['--resume-column-gap' as string]: `${designOverrides?.columnGap ?? 24}px`,
  } as CSSProperties;

  return (
    <>
      <div style={designStyle}>
        <div ref={measureRef} className="resumeMeasureLayer" aria-hidden="true">
          {renderPage({ index: 0, regions: regions.map((region) => ({ id: region.id, blocks: region.blocks, overflowedBlockIds: [] })) })}
          {regions.flatMap((region) => flattenLayoutBlocks(region.blocks)
            .filter((block) => Boolean(block.continuationMetadata))
            .map((block) => {
              const continuationId = `${block.id}-continuation`;
              return (
                <div
                  key={`${region.id}:${continuationId}`}
                  className="resumeMeasureContinuation"
                  data-layout-block={continuationId}
                  style={{
                    position: 'absolute',
                    visibility: 'hidden',
                    pointerEvents: 'none',
                    left: '-9999px',
                    width: `${page.width - page.padding.left - page.padding.right}px`,
                  }}
                >
                  {block.continuation}
                </div>
              );
            }))}
        </div>
        <div className="resumeDocument">
          {layoutPages.map((layoutPage) => (
            <div className="resumeRenderedPage" key={layoutPage.index}>
              <div className="resumePageLabel" aria-hidden="true">Page {layoutPage.index + 1} of {layoutPages.length}</div>
              {renderPage(layoutPage)}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

