/**
 * MainResume — thin editor orchestrator.
 *
 * Responsibilities:
 *  1. Resolve the correct template adapter for the document's templateId.
 *  2. Build the header layout block (shared on every page render).
 *  3. Delegate layout-node creation and page rendering entirely to the adapter.
 *  4. Wire MeasuredResumePages for DOM measurement → pagination → layout plan.
 *
 * No section-specific JSX lives here; it all lives in the adapter (e.g. classicAdapter.tsx).
 */

import { type ReactNode } from 'react';
import type { ResumeDocument } from './resumeModel';
import type { LayoutBlock, SerializedLayoutPlan } from './layout';
import type { EditorSelection } from './resumeEditorPopover';
import { MeasuredResumePages } from './layoutComponents';
import { getTemplateAdapter } from './templates';
import EditableText from '../editableTags/editableText/editableText';
import './mainResume.css';

// Side-effect import — registers the classic adapter into the registry.
import './classicAdapter';

interface MainResumeProps {
  resume: ResumeDocument;
  onChange: (path: string, value: string) => void;
  onSelectEditor?: (selection: EditorSelection) => void;
  onLayoutPlanChange?: (plan: SerializedLayoutPlan) => void;
}

const MainResume = ({ resume, onChange, onSelectEditor, onLayoutPlanChange }: MainResumeProps) => {
  const adapter = getTemplateAdapter(resume.templateId);
  const { definition } = adapter;

  const headerBlock: LayoutBlock<ReactNode> = {
    id: 'header',
    regionId: 'header',
    content: (
      <div className="resumeHeader" onClick={() => onSelectEditor?.({ type: 'header' })}>
        <EditableText
          tag="h1"
          value={resume.content.header.name}
          onChange={(value) => onChange('header.name', value)}
          editable
        />
        <div className="contactInfo">
          <span><i className="fa-solid fa-phone fa-xs" />{resume.content.header.contact}</span>
          <span><i className="fa-solid fa-at fa-xs" />{resume.content.header.email}</span>
          <span><i className="fa-brands fa-linkedin" />{resume.content.header.link}</span>
          <span><i className="fa-solid fa-location-dot fa-xs" />{resume.content.header.location}</span>
        </div>
      </div>
    ),
    keepTogether: true,
    canSplit: false,
    splitStrategy: 'none',
  };

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
