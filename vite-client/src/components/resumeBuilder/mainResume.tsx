/**
 * MainResume — thin editor orchestrator.
 *
 * Responsibilities:
 *  1. Resolve the correct template adapter for the document's templateId.
 *  2. Build the header layout block via the adapter (template-owned).
 *  3. Delegate layout-node creation and page rendering entirely to the adapter.
 *  4. Wire MeasuredResumePages for DOM measurement → pagination → layout plan.
 *
 * No section-specific JSX lives here; it all lives in the adapter (e.g. classicAdapter.tsx).
 */

import type { ResumeDocument } from './resumeModel';
import type { SerializedLayoutPlan } from './layout';
import type { EditorSelection } from './resumeEditorPopover';
import { MeasuredResumePages } from './layoutComponents';
import { getTemplateAdapter } from './templates';
import './mainResume.css';

// Side-effect imports — register the adapters into the registry.
import './classicAdapter';
import './professionalAdapter';

interface MainResumeProps {
  resume: ResumeDocument;
  onChange: (path: string, value: string) => void;
  onSelectEditor?: (selection: EditorSelection) => void;
  onLayoutPlanChange?: (plan: SerializedLayoutPlan) => void;
}

const MainResume = ({ resume, onChange, onSelectEditor, onLayoutPlanChange }: MainResumeProps) => {
  const adapter = getTemplateAdapter(resume.templateId);
  const { definition } = adapter;

  const headerBlock = adapter.createHeaderBlock(resume, { onChange, onSelectEditor });

  const regions = adapter.createLayoutRegions(resume, { onChange, onSelectEditor });

  return (
    <MeasuredResumePages
      page={definition.page}
      regions={regions}
      onLayoutPlanChange={onLayoutPlanChange}
      planMetadata={{ templateId: definition.id, templateVersion: definition.version }}
      renderPage={(page) => adapter.renderPage(page, headerBlock)}
    />
  );
};

export default MainResume;
