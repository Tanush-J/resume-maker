/**
 * Professional Resume Template Adapter
 *
 * A centered-header, single-column template inspired by the reference
 * screenshot. Owns:
 *  - How ResumeDocument content maps to layout nodes for the `main` region.
 *  - How paginated pages render as React JSX.
 *
 * Follows the same semantic block contract as Classic so the shared
 * measurement → pagination → serialized layout plan pipeline is identical:
 *   - section headings: `${sectionId}-heading` (keepWithNext)
 *   - section container: splittable grouping with explicit continuationMetadata
 *   - experience/project items: `${itemId}-head` (atomic) + `${itemId}-bullet-N` (flowing)
 *   - skills: single atomic block (tag chips)
 *   - social/education/training/achievements/summary: atomic item blocks
 *
 * Column values on sections are IGNORED — this template is single-column.
 */

import './professional.css';
import { Fragment, type ReactNode } from 'react';
import EditableLink from '../editableTags/editableLink/editableLink';
import EditableText from '../editableTags/editableText/editableText';
import { ResumePage, ResumeRegion } from './layoutComponents';
import type { ContinuationMetadata, LayoutBlock, LayoutRegion } from './layout';
import {
  sectionById,
  type ResumeDocument,
  type SummarySection,
  type ExperienceSection,
  type ProjectsSection,
  type SkillsSection,
  type SocialSection,
  type EducationSection,
  type TrainingCoursesSection,
  type AchievementsSection,
} from './resumeModel';
import {
  professionalTemplate,
  registerTemplateAdapter,
  type ResumeTemplateAdapter,
  type TemplateAdapterCallbacks,
} from './templates';

// ─── Continuation metadata (explicit — the server must not sniff ids) ────────

const CONTINUATION: Record<string, ContinuationMetadata> = {
  summary: { sectionId: 'summary', title: 'Summary (continued)' },
  experience: { sectionId: 'experience', title: 'Experience (continued)' },
  projects: { sectionId: 'projects', title: 'Projects (continued)' },
  skills: { sectionId: 'skills', title: 'Skills (continued)' },
  social: { sectionId: 'social', title: 'Find Me Online (continued)' },
  education: { sectionId: 'education', title: 'Education (continued)' },
  trainingCourses: { sectionId: 'trainingCourses', title: 'Training / Courses (continued)' },
  achievements: { sectionId: 'achievements', title: 'Achievements (continued)' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeBlock = (
  id: string,
  regionId: string,
  contentNode: ReactNode,
  explicitChildren?: LayoutBlock<ReactNode>[],
  continuation?: ReactNode,
  continuationMetadata?: ContinuationMetadata,
  keepWithNext?: boolean,
  allowSplit?: boolean,
): LayoutBlock<ReactNode> => ({
  id,
  regionId,
  content: contentNode,
  children: explicitChildren,
  keepTogether: true,
  canSplit: explicitChildren !== undefined,
  splitStrategy: explicitChildren !== undefined ? 'children' : 'none',
  continuation,
  continuationMetadata,
  keepWithNext,
  allowSplit,
});

const makeSectionContainer = (
  id: string,
  regionId: string,
  children: LayoutBlock<ReactNode>[],
): LayoutBlock<ReactNode> => makeBlock(
  id,
  regionId,
  null,
  children,
  <div className="pSectionContinuationHeading"><h2>{CONTINUATION[id].title}</h2></div>,
  CONTINUATION[id],
  undefined,
  true,
);

const makeSectionHeading = (
  id: string,
  regionId: string,
  title: string,
): LayoutBlock<ReactNode> => makeBlock(
  `${id}-heading`,
  regionId,
  <div className="pSectionHeadingWrapper">
    <div className="pSectionHeading"><h2>{title}</h2></div>
  </div>,
  [],
  undefined,
  undefined,
  true,
);

/** Adapter-owned default section order (single column). */
const PROFESSIONAL_SECTION_ORDER: Array<{
  section: 'summary' | 'experience' | 'projects' | 'skills' | 'social' | 'education' | 'trainingCourses' | 'achievements';
  title: string;
}> = [
  { section: 'summary', title: 'Summary' },
  { section: 'experience', title: 'Experience' },
  { section: 'projects', title: 'Projects' },
  { section: 'skills', title: 'Skills' },
  { section: 'social', title: 'Find Me Online' },
  { section: 'education', title: 'Education' },
  { section: 'trainingCourses', title: 'Training / Courses' },
  { section: 'achievements', title: 'Achievements' },
];

// ─── Render helpers ──────────────────────────────────────────────────────────

const renderLayoutBlock = (item: LayoutBlock<ReactNode>): ReactNode => {
  const children = item.children ?? item.parts;
  if (children?.length) {
    return children.map((child) => <Fragment key={child.id}>{renderLayoutBlock(child)}</Fragment>);
  }
  return <div className="layoutBlock" data-layout-block={item.id}>{item.content}</div>;
};

// ─── Professional Adapter implementation ────────────────────────────────────

const professionalAdapterImpl: ResumeTemplateAdapter = {
  definition: professionalTemplate,

  createHeaderBlock(
    resume: ResumeDocument,
    callbacks: TemplateAdapterCallbacks,
  ): LayoutBlock<ReactNode> {
    const { onChange, onSelectEditor } = callbacks;
    const header = resume.content.header;

    // Derive a headline fallback: header.title → first visible experience
    // designation → empty.
    const experienceSection = sectionById(resume.content.sections, 'experience') as ExperienceSection | undefined;
    const fallbackTitle = experienceSection?.items?.find((item) => item.designation)?.designation ?? '';
    const title = header.title || fallbackTitle;

    return {
      id: 'header',
      regionId: 'header',
      content: (
        <div className="professionalTemplate pHeader" onClick={() => onSelectEditor?.({ type: 'header' })}>
          <EditableText
            tag="h1"
            value={header.name}
            onChange={(value) => onChange('header.name', value)}
            editable
          />
          {title && (
            <EditableText
              tag="p"
              className="pHeaderTitle"
              value={title}
              onChange={(value) => onChange('header.title', value)}
              editable
            />
          )}
          <div className="pHeaderContact">
            <span><i className="fa-solid fa-location-dot fa-xs" />{header.location}</span>
            <span><i className="fa-solid fa-at fa-xs" />{header.email}</span>
            <span><i className="fa-solid fa-phone fa-xs" />{header.contact}</span>
            <span><i className="fa-solid fa-link fa-xs" />{header.link}</span>
          </div>
        </div>
      ),
      keepTogether: true,
      canSplit: false,
      splitStrategy: 'none',
    };
  },

  createLayoutRegions(
    resume: ResumeDocument,
    callbacks: TemplateAdapterCallbacks,
  ): LayoutRegion<ReactNode>[] {
    const { content } = resume;
    const { onChange, onSelectEditor } = callbacks;
    const regionId = 'main';

    const sectionFor = (id: Parameters<typeof sectionById>[1]) => sectionById(content.sections, id);
    const isVisible = (id: Parameters<typeof sectionById>[1]) => sectionFor(id)?.enabled ?? false;
    const buildBlocksPart = <T,>(sectionId: Parameters<typeof sectionById>[1], build: (section: T) => LayoutBlock<ReactNode>[]): LayoutBlock<ReactNode>[] =>
      isVisible(sectionId) ? build(sectionFor(sectionId) as T) : [];

    // ── Summary blocks ──
    const summarySection = sectionFor('summary') as SummarySection | undefined;
    const summaryParts: LayoutBlock<ReactNode>[] = [
      makeSectionHeading('summary', regionId, 'Summary'),
      ...(summarySection?.items ?? []).flatMap((summary, index) => {
        const sectionIndex = content.sections.indexOf(summarySection!);
        return summary.text
          ? [makeBlock(
              `summary-${index}`,
              regionId,
              <div className="pSummarySection">
                <div className="pItem" onClick={() => onSelectEditor?.({ type: 'summary', id: summary.id })}>
                  <EditableText
                    onChange={(value) => onChange(`sections.${sectionIndex}.items.${index}.text`, value)}
                    editable
                    tag="p"
                    value={summary.text}
                  />
                </div>
              </div>,
            )]
          : [];
      }),
    ];

    // ── Experience blocks ──
    const experienceSection = sectionFor('experience') as ExperienceSection | undefined;
    const experienceParts: LayoutBlock<ReactNode>[] = [
      makeSectionHeading('experience', regionId, 'Experience'),
      ...(experienceSection?.items ?? []).flatMap((experience, index) => {
        const sectionIndex = content.sections.indexOf(experienceSection!);
        const itemPath = `sections.${sectionIndex}.items.${index}`;

        const bullets = experience.description.length ? experience.description : [''];
        const head = makeBlock(
          `${experience.id}-head`,
          regionId,
          <div className="pExperienceSection">
            <div className="pItem" onClick={() => onSelectEditor?.({ type: 'experience', id: experience.id })}>
              <div className="pItemHeaderRow">
                <div>
                  {experience.designation && <EditableText tag="h3" value={experience.designation} onChange={(value) => onChange(`${itemPath}.designation`, value)} editable />}
                  {experience.company && <EditableText tag="h4" value={experience.company} onChange={(value) => onChange(`${itemPath}.company`, value)} editable />}
                </div>
                <div className="pItemMeta">
                  <span><i className="fa-solid fa-calendar-days" /><EditableText tag="span" value={experience.start} onChange={(value) => onChange(`${itemPath}.start`, value)} editable /> - <EditableText tag="span" value={experience.end} onChange={(value) => onChange(`${itemPath}.end`, value)} editable /></span>
                  {experience.location && <span><i className="fa-solid fa-location-dot" /><EditableText tag="span" value={experience.location} onChange={(value) => onChange(`${itemPath}.location`, value)} editable /></span>}
                </div>
              </div>
              {experience.link && <a className="pItemLink" target="_blank" href={experience.link} rel="noreferrer"><i className="fa-solid fa-link" />Link</a>}
              <ul>
                <EditableText
                  onChange={(value) => onChange(`${itemPath}.description.0`, value)}
                  editable
                  tag="li"
                  value={bullets[0]}
                />
              </ul>
            </div>
          </div>,
        );

        const flowingBullets = bullets.slice(1).map((listItem, flowIndex) =>
          makeBlock(
            `${experience.id}-bullet-${flowIndex + 1}`,
            regionId,
            <div className="pExperienceSection">
              <div className="pItem" onClick={() => onSelectEditor?.({ type: 'experience', id: experience.id })}>
                <ul>
                  <EditableText
                    onChange={(value) => onChange(`${itemPath}.description.${flowIndex + 1}`, value)}
                    editable
                    tag="li"
                    value={listItem}
                  />
                </ul>
              </div>
            </div>,
          ),
        );

        return [makeBlock(
          experience.id,
          regionId,
          null,
          [head, ...flowingBullets],
          undefined,
          undefined,
          undefined,
          true,
        )];
      }),
    ];

    // ── Project blocks ──
    const projectsSection = sectionFor('projects') as ProjectsSection | undefined;
    const projectParts: LayoutBlock<ReactNode>[] = [
      makeSectionHeading('projects', regionId, 'Projects'),
      ...(projectsSection?.items ?? []).flatMap((project, index) => {
        if (!project.show) return [];
        const sectionIndex = content.sections.indexOf(projectsSection!);
        const itemPath = `sections.${sectionIndex}.items.${index}`;

        const bullets = project.description.length ? project.description : [''];
        const head = makeBlock(
          `${project.id}-head`,
          regionId,
          <div className="pProjectsSection">
            <div className="pItem" onClick={() => onSelectEditor?.({ type: 'project', id: project.id })}>
              <div className="pItemHeaderRow">
                <EditableText onChange={(value) => onChange(`${itemPath}.title`, value)} editable tag="h3" value={project.title} />
              </div>
              {project.link && (
                <div className="pLinkField">
                  <a target="_blank" href={project.link} rel="noreferrer">
                    <i className="fa-solid fa-link fa-xs" />{project.link}
                  </a>
                </div>
              )}
              <ul>
                <EditableText
                  onChange={(value) => onChange(`${itemPath}.description.0`, value)}
                  editable
                  tag="li"
                  value={bullets[0]}
                />
              </ul>
            </div>
          </div>,
        );

        const flowingBullets = bullets.slice(1).map((listItem, flowIndex) =>
          makeBlock(
            `${project.id}-bullet-${flowIndex + 1}`,
            regionId,
            <div className="pProjectsSection">
              <div className="pItem" onClick={() => onSelectEditor?.({ type: 'project', id: project.id })}>
                <ul>
                  <EditableText
                    onChange={(value) => onChange(`${itemPath}.description.${flowIndex + 1}`, value)}
                    editable
                    tag="li"
                    value={listItem}
                  />
                </ul>
              </div>
            </div>,
          ),
        );

        return [makeBlock(
          project.id,
          regionId,
          null,
          [head, ...flowingBullets],
          undefined,
          undefined,
          undefined,
          true,
        )];
      }),
    ];

    // ── Skills block (single atomic block of tag chips) ──
    const skillsSection = sectionFor('skills') as SkillsSection | undefined;
    const skillsParts: LayoutBlock<ReactNode>[] = buildBlocksPart<SkillsSection>('skills', () => [
      makeSectionHeading('skills', regionId, 'Skills'),
      makeBlock(
        'skills',
        regionId,
        <div className="pSkillsSection">
          <div className="pSkillChips">
            {(skillsSection?.items?.[0]?.tags ?? []).map((skill, index) => (
              <span key={`skill-${index}`} className="pSkillChip" onClick={() => onSelectEditor?.({ type: 'skill', index })}>
                <EditableText onChange={(value) => onChange(`sections.${content.sections.indexOf(skillsSection!)}.items.0.tags.${index}`, value)} editable tag="span" value={skill} />
              </span>
            ))}
          </div>
        </div>,
      ),
    ]);

    // ── Social blocks ──
    const socialSection = sectionFor('social') as SocialSection | undefined;
    const socialParts: LayoutBlock<ReactNode>[] = [
      makeSectionHeading('social', regionId, 'Find Me Online'),
      ...(socialSection?.items ?? []).flatMap((social, index) =>
        social.name || social.link
          ? [makeBlock(
              `social-${index}`,
              regionId,
              <div className="pSocialSection">
                <div className="pItem" key={social.id} onClick={() => onSelectEditor?.({ type: 'social', id: social.id })}>
                  <div className="pSocialRow">
                    <i className={social.icon} />
                    <EditableText onChange={(value) => onChange(`sections.${content.sections.indexOf(socialSection!)}.items.${index}.name`, value)} editable tag="p" value={social.name} />
                  </div>
                  <div className="pLinkField">
                    <EditableText onChange={(value) => onChange(`sections.${content.sections.indexOf(socialSection!)}.items.${index}.link`, value)} editable tag="span" value={social.link} />
                  </div>
                </div>
                {index < (socialSection?.items?.length ?? 0) - 1 && <div className="pItemSeparator" />}
              </div>,
            )]
          : [],
      ),
    ];

    // ── Education blocks ──
    const educationSection = sectionFor('education') as EducationSection | undefined;
    const educationParts: LayoutBlock<ReactNode>[] = [
      makeSectionHeading('education', regionId, 'Education'),
      ...(educationSection?.items ?? []).flatMap((education, index) =>
        education.show
          ? [makeBlock(
              `education-${index}`,
              regionId,
              <div className="pEducationSection">
                <div className="pItem" key={education.id} onClick={() => onSelectEditor?.({ type: 'education', id: education.id })}>
                  <div className="pItemHeaderRow">
                    <div>
                      <EditableText onChange={(value) => onChange(`sections.${content.sections.indexOf(educationSection!)}.items.${index}.degree`, value)} editable tag="h3" value={education.degree} />
                      <EditableText onChange={(value) => onChange(`sections.${content.sections.indexOf(educationSection!)}.items.${index}.location`, value)} editable tag="h4" value={education.location} />
                    </div>
                    <div className="pItemMeta">
                      <span><EditableText onChange={(value) => onChange(`sections.${content.sections.indexOf(educationSection!)}.items.${index}.start`, value)} editable tag="span" value={education.start} /> - <EditableText onChange={(value) => onChange(`sections.${content.sections.indexOf(educationSection!)}.items.${index}.end`, value)} editable tag="span" value={education.end} /></span>
                    </div>
                  </div>
                  {education.gpa.type && (
                    <div className="pEducationGpa">
                      <EditableText onChange={(value) => onChange(`sections.${content.sections.indexOf(educationSection!)}.items.${index}.gpa.type`, value)} editable tag="span" value={education.gpa.type} />
                      <span>: </span>
                      <EditableText onChange={(value) => onChange(`sections.${content.sections.indexOf(educationSection!)}.items.${index}.gpa.score`, value)} editable tag="span" value={education.gpa.score} />
                      <span> / </span>
                      <EditableText onChange={(value) => onChange(`sections.${content.sections.indexOf(educationSection!)}.items.${index}.gpa.outOf`, value)} editable tag="span" value={education.gpa.outOf} />
                    </div>
                  )}
                </div>
              </div>,
            )]
          : [],
      ),
    ];

    // ── Training / Courses blocks ──
    const trainingCoursesSection = sectionFor('trainingCourses') as TrainingCoursesSection | undefined;
    const trainingParts: LayoutBlock<ReactNode>[] = [
      makeSectionHeading('trainingCourses', regionId, 'Training / Courses'),
      ...(trainingCoursesSection?.items ?? []).flatMap((item, index) =>
        item.show
          ? [makeBlock(
              `trainingCourses-${index}`,
              regionId,
              <div className="pTrainingCoursesSection">
                <div className="pItem" key={item.id} onClick={() => onSelectEditor?.({ type: 'trainingCourse', id: item.id })}>
                  <div className="pLinkContainer">
                    <EditableText onChange={(value) => onChange(`sections.${content.sections.indexOf(trainingCoursesSection!)}.items.${index}.title`, value)} tag="h4" editable value={item.title} />
                    <EditableLink name="" className="pCertificateLink" href={item.link} editable>
                      <i className="fa-solid fa-link fa-base" />
                    </EditableLink>
                  </div>
                  <EditableText onChange={(value) => onChange(`sections.${content.sections.indexOf(trainingCoursesSection!)}.items.${index}.description`, value)} editable tag="p" value={item.description} />
                </div>
              </div>,
            )]
          : [],
      ),
    ];

    // ── Achievement blocks ──
    const achievementsSection = sectionFor('achievements') as AchievementsSection | undefined;
    const achievementParts: LayoutBlock<ReactNode>[] = [
      makeSectionHeading('achievements', regionId, 'Achievements'),
      ...(achievementsSection?.items ?? []).map((achievement, index) =>
        makeBlock(
          `achievements-${index}`,
          regionId,
          <div className="pAchievementsSection">
            <div className="pItem" key={achievement.id} onClick={() => onSelectEditor?.({ type: 'achievement', id: achievement.id })}>
              <div className="pLinkContainer">
                <EditableText onChange={(value) => onChange(`sections.${content.sections.indexOf(achievementsSection!)}.items.${index}.title`, value)} tag="h4" editable value={achievement.title} />
                <EditableLink name="" className="pCertificateLink" href={achievement.link} editable>
                  <i className="fa-solid fa-link fa-base" />
                </EditableLink>
              </div>
              <p>{achievement.description}</p>
            </div>
          </div>,
        ),
      ),
    ];

    // ── Assemble in the adapter-owned default order (single `main` region) ──
    const partsBySection: Record<string, LayoutBlock<ReactNode>[]> = {
      summary: summaryParts,
      experience: experienceParts,
      projects: projectParts,
      skills: skillsParts,
      social: socialParts,
      education: educationParts,
      trainingCourses: trainingParts,
      achievements: achievementParts,
    };

    const mainBlocks = PROFESSIONAL_SECTION_ORDER
      .filter(({ section }) => isVisible(section))
      .map(({ section }) => {
        const parts = partsBySection[section];
        return makeSectionContainer(section, regionId, parts);
      });

    return [
      { id: 'main', flow: 'vertical', blocks: mainBlocks },
    ];
  },

  renderPage(page, headerBlock) {
    return (
      <ResumePage page={professionalTemplate.page}>
        <div className="professionalTemplate">
          <div className="pResumeBody">
            {page.index === 0 && headerBlock && (
              <div className="layoutBlock" data-layout-block="header">
                {headerBlock.content}
              </div>
            )}
            {page.regions.map((region) => (
              <div className="pRegion" key={region.id}>
                <ResumeRegion id={region.id}>
                  {region.blocks.map((item) => (
                    <Fragment key={item.id}>{renderLayoutBlock(item)}</Fragment>
                  ))}
                </ResumeRegion>
              </div>
            ))}
          </div>
        </div>
      </ResumePage>
    );
  },
};

// ─── Self-register ────────────────────────────────────────────────────────────

registerTemplateAdapter(professionalAdapterImpl);

export { professionalAdapterImpl as professionalAdapter };