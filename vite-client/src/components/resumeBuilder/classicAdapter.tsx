/**
 * Classic Resume Template Adapter
 *
 * Owns:
 *  - How ResumeDocument content is mapped to layout nodes (section structure,
 *    bullet-level splitting, continuation headings).
 *  - How a paginated page is rendered as React JSX.
 *
 * BuildResume / mainResume never inspect any JSX produced here.
 */

import { Fragment, type ReactNode } from 'react';
import EditableLink from '../editableTags/editableLink/editableLink';
import EditableText from '../editableTags/editableText/editableText';
import { ResumePage, ResumeRegion } from './layoutComponents';
import type { ContinuationMetadata, LayoutBlock, LayoutRegion } from './layout';
import {
  sectionById,
  type ResumeDocument,
  type ExperienceSection,
  type ProjectsSection,
  type SkillsSection,
  type SocialSection,
  type EducationSection,
  type TrainingCoursesSection,
  type AchievementsSection,
} from './resumeModel';
import {
  classicTemplate,
  registerTemplateAdapter,
  type ResumeTemplateAdapter,
  type TemplateAdapterCallbacks,
} from './templates';

// ─── Continuation metadata (explicit — the server must not sniff ids) ────────

const CONTINUATION: Record<string, ContinuationMetadata> = {
  experience: { sectionId: 'experience', title: 'Experience (continued)' },
  projects: { sectionId: 'projects', title: 'Projects (continued)' },
  social: { sectionId: 'social', title: 'Find Me Online (continued)' },
  education: { sectionId: 'education', title: 'Education (continued)' },
  trainingCourses: { sectionId: 'trainingCourses', title: 'Training / Courses (continued)' },
  achievements: { sectionId: 'achievements', title: 'Achievements (continued)' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a layout block.
 *
 * Semantic model:
 *  - `explicitChildren` + `allowSplit` → transparent grouping container whose
 *    children flow across pages (sections, experience/project items).
 *  - `explicitChildren` (no `allowSplit`) → atomic container kept on one page.
 *  - no children → leaf content node (measured/paginated as one unit).
 */
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

/**
 * A section container: transparent grouping carrying the section's explicit
 * continuation metadata, so a page break inside it emits exactly one
 * continuation heading per page. `continuation` is the React node rendered
 * at the top of the page following the break.
 */
const makeSectionContainer = (
  id: string,
  regionId: string,
  children: LayoutBlock<ReactNode>[],
): LayoutBlock<ReactNode> => makeBlock(
  id,
  regionId,
  null,
  children,
  <div className="sectionContinuationHeading"><h2>{CONTINUATION[id].title}</h2></div>,
  CONTINUATION[id],
  undefined,
  true,
);

/**
 * A section heading leaf. `keepWithNext` prevents the heading from being left
 * alone at the bottom of a page when its first item lands on the next page.
 */
const makeSectionHeading = (
  id: string,
  regionId: string,
  className: string,
  title: string,
): LayoutBlock<ReactNode> => makeBlock(
  `${id}-heading`,
  regionId,
  <div className={className}>
    <div className="sectionHeading"><h2>{title}</h2></div>
  </div>,
  [],
  undefined,
  undefined,
  true,
);

// ─── Render helpers ───────────────────────────────────────────────────────────

const renderLayoutBlock = (item: LayoutBlock<ReactNode>): ReactNode => {
  const children = item.children ?? item.parts;
  if (children?.length) {
    return children.map((child) => <Fragment key={child.id}>{renderLayoutBlock(child)}</Fragment>);
  }
  return <div className="layoutBlock" data-layout-block={item.id}>{item.content}</div>;
};

// ─── Classic Adapter implementation ──────────────────────────────────────────

const classicAdapterImpl: ResumeTemplateAdapter = {
  definition: classicTemplate,

  createLayoutRegions(
    resume: ResumeDocument,
    callbacks: TemplateAdapterCallbacks,
  ): LayoutRegion<ReactNode>[] {
    const { content } = resume;
    const { onChange, onSelectEditor } = callbacks;

    // ── Placement helpers (derived from the generic sections array) ──
    const sectionFor = (id: Parameters<typeof sectionById>[1]) => sectionById(content.sections, id);
    const isVisible = (id: Parameters<typeof sectionById>[1]) => sectionFor(id)?.enabled ?? false;

    // ── Experience blocks ──
    const experienceSection = sectionFor('experience') as ExperienceSection | undefined;
    const experienceParts: LayoutBlock<ReactNode>[] = [
      makeSectionHeading('experience', 'main', 'resumeExperienceSection', 'Experience'),
      ...(experienceSection?.items ?? []).flatMap((experience, index) => {
        const sectionIndex = content.sections.indexOf(experienceSection!);
        const itemPath = `sections.${sectionIndex}.items.${index}`;

        // Semantic item container: head (header + first bullet) is atomic;
        // remaining bullets flow to subsequent pages if needed.
        const bullets = experience.description.length ? experience.description : [''];
        const head = makeBlock(
          `${experience.id}-head`,
          'main',
          <div className="resumeExperienceSection">
            <div className="itemObject" onClick={() => onSelectEditor?.({ type: 'experience', id: experience.id })}>
              {experience.designation && <EditableText tag="h3" value={experience.designation} onChange={(value) => onChange(`${itemPath}.designation`, value)} editable />}
              {experience.company && <EditableText tag="h4" value={experience.company} onChange={(value) => onChange(`${itemPath}.company`, value)} editable />}
              <div className="experienceItemIconContainer">
                <span>
                  <i className="fa-solid fa-calendar-days" />
                  <EditableText tag="span" value={experience.start} onChange={(value) => onChange(`${itemPath}.start`, value)} editable /> - <EditableText tag="span" value={experience.end} onChange={(value) => onChange(`${itemPath}.end`, value)} editable />&nbsp;
                </span>
                {experience.location && <span><i className="fa-solid fa-location-dot" /><EditableText tag="span" value={experience.location} onChange={(value) => onChange(`${itemPath}.location`, value)} editable /></span>}
                {experience.link && <a className="experienceItemLink" target="_blank" href={experience.link} rel="noreferrer"><i className="fa-solid fa-link" />Link</a>}
              </div>
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
            'main',
            <div className="resumeExperienceSection">
              <div className="itemObject" onClick={() => onSelectEditor?.({ type: 'experience', id: experience.id })}>
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

        // One item per container: header + bullet 0 stay together; extra
        // bullets may overflow onto the next page.
        return [makeBlock(
          experience.id,
          'main',
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
      makeSectionHeading('projects', 'main', 'resumeProjectsSection', 'Projects'),
      ...(projectsSection?.items ?? []).flatMap((project, index) => {
        if (!project.show) return [];
        const sectionIndex = content.sections.indexOf(projectsSection!);
        const itemPath = `sections.${sectionIndex}.items.${index}`;

        const bullets = project.description.length ? project.description : [''];
        const head = makeBlock(
          `${project.id}-head`,
          'main',
          <div className="resumeProjectsSection">
            <div className="itemObject" onClick={() => onSelectEditor?.({ type: 'project', id: project.id })}>
              <EditableText onChange={(value) => onChange(`${itemPath}.title`, value)} editable tag="h3" value={project.title} />
              <div className="linkField">
                <a target="_blank" href={project.link} rel="noreferrer">
                  <i className="fa-solid fa-link fa-xs" />{project.link}
                </a>
              </div>
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
            'main',
            <div className="resumeProjectsSection">
              <div className="itemObject" onClick={() => onSelectEditor?.({ type: 'project', id: project.id })}>
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
          'main',
          null,
          [head, ...flowingBullets],
          undefined,
          undefined,
          undefined,
          true,
        )];
      }),
    ];

    // ── Sidebar blocks ──
    const skillsSection = sectionFor('skills') as SkillsSection | undefined;
    const skillsBlock = isVisible('skills')
      ? makeBlock(
          'skills',
          'sidebar',
          <div className="resumeSkillSection">
            <div className="sectionHeading"><h2>Skills</h2></div>
            <div className="itemObject skillContainer">
              {(skillsSection?.items?.[0]?.tags ?? []).map((skill, index) => (
                <span key={`skill-${index}`} onClick={() => onSelectEditor?.({ type: 'skill', index })}>
                  <EditableText onChange={(value) => onChange(`sections.${content.sections.indexOf(skillsSection!)}.items.0.tags.${index}`, value)} editable tag="span" value={skill} />
                </span>
              ))}
            </div>
          </div>,
        )
      : null;

    // ── Sidebar sections (each item is its own atomic block so sections can
    //    split at item boundaries; skills stays as one wrapping block) ──
    const socialSection = sectionFor('social') as SocialSection | undefined;
    const socialParts: LayoutBlock<ReactNode>[] = [
      makeSectionHeading('social', 'sidebar', 'resumeFindMeOnlineSection', 'Find Me Online'),
      ...(socialSection?.items ?? []).flatMap((social, index) =>
        social.name || social.link
          ? [makeBlock(
              `social-${index}`,
              'sidebar',
              <div className="resumeFindMeOnlineSection">
                <div className="itemObject" key={social.id} onClick={() => onSelectEditor?.({ type: 'social', id: social.id })}>
                  <div className="socialIconContainer">
                    <i className={social.icon} />
                    <EditableText onChange={(value) => onChange(`sections.${content.sections.indexOf(socialSection!)}.items.${index}.name`, value)} editable tag="p" value={social.name} />
                  </div>
                  <div className="linkField">
                    <EditableText onChange={(value) => onChange(`sections.${content.sections.indexOf(socialSection!)}.items.${index}.link`, value)} editable tag="span" value={social.link} />
                  </div>
                </div>
                {index < (socialSection?.items?.length ?? 0) - 1 && <div className="itemSeperator" />}
              </div>,
            )]
          : [],
      ),
    ];

    const educationSection = sectionFor('education') as EducationSection | undefined;
    const educationParts: LayoutBlock<ReactNode>[] = [
      makeSectionHeading('education', 'sidebar', 'resumeEducationSection', 'Education'),
      ...(educationSection?.items ?? []).flatMap((education, index) =>
        education.show
          ? [makeBlock(
              `education-${index}`,
              'sidebar',
              <div className="resumeEducationSection">
                <div className="itemObject" key={education.id} onClick={() => onSelectEditor?.({ type: 'education', id: education.id })}>
                  <div>
                    <EditableText onChange={(value) => onChange(`sections.${content.sections.indexOf(educationSection!)}.items.${index}.degree`, value)} editable tag="h3" value={education.degree} />
                    <EditableText onChange={(value) => onChange(`sections.${content.sections.indexOf(educationSection!)}.items.${index}.location`, value)} editable tag="h4" value={education.location} />
                    <span>
                      <EditableText onChange={(value) => onChange(`sections.${content.sections.indexOf(educationSection!)}.items.${index}.start`, value)} editable tag="span" value={education.start} /> - <EditableText onChange={(value) => onChange(`sections.${content.sections.indexOf(educationSection!)}.items.${index}.end`, value)} editable tag="span" value={education.end} />
                    </span>
                  </div>
                  <div className="educationItemGpa">
                    <EditableText onChange={(value) => onChange(`sections.${content.sections.indexOf(educationSection!)}.items.${index}.gpa.type`, value)} editable tag="p" value={education.gpa.type} />
                    <div>
                      <EditableText onChange={(value) => onChange(`sections.${content.sections.indexOf(educationSection!)}.items.${index}.gpa.score`, value)} editable tag="span" value={education.gpa.score} className="score" />
                      <span> / </span>
                      <EditableText onChange={(value) => onChange(`sections.${content.sections.indexOf(educationSection!)}.items.${index}.gpa.outOf`, value)} editable tag="span" value={education.gpa.outOf} />
                    </div>
                  </div>
                </div>
              </div>,
            )]
          : [],
      ),
    ];

    const trainingCoursesSection = sectionFor('trainingCourses') as TrainingCoursesSection | undefined;
    const trainingParts: LayoutBlock<ReactNode>[] = [
      makeSectionHeading('trainingCourses', 'sidebar', 'resumeTrainingCoursesSection', 'Training / Courses'),
      ...(trainingCoursesSection?.items ?? []).flatMap((item, index) =>
        item.show
          ? [makeBlock(
              `trainingCourses-${index}`,
              'sidebar',
              <div className="resumeTrainingCoursesSection">
                <div className="itemObject" key={item.id} onClick={() => onSelectEditor?.({ type: 'trainingCourse', id: item.id })}>
                  <div className="linkContainer">
                    <EditableText onChange={(value) => onChange(`sections.${content.sections.indexOf(trainingCoursesSection!)}.items.${index}.title`, value)} tag="h4" editable value={item.title} />
                    <EditableLink name="" className="certificateItemLink" href={item.link} editable>
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

    const achievementsSection = sectionFor('achievements') as AchievementsSection | undefined;
    const achievementParts: LayoutBlock<ReactNode>[] = [
      makeSectionHeading('achievements', 'sidebar', 'resumeAchievementsSection', 'Achievements'),
      ...(achievementsSection?.items ?? []).map((achievement, index) =>
        makeBlock(
          `achievements-${index}`,
          'sidebar',
          <div className="resumeAchievementsSection">
            <div className="itemObject" key={achievement.id} onClick={() => onSelectEditor?.({ type: 'achievement', id: achievement.id })}>
              <div className="linkContainer">
                <EditableText onChange={(value) => onChange(`sections.${content.sections.indexOf(achievementsSection!)}.items.${index}.title`, value)} tag="h4" editable value={achievement.title} />
                <EditableLink name="" className="certificateItemLink" href={achievement.link} editable>
                  <i className="fa-solid fa-link fa-base" />
                </EditableLink>
              </div>
              <p>{achievement.description}</p>
            </div>
          </div>,
        ),
      ),
    ];

    // ── Assemble: route each block to the correct region by column ──
    const mainBlocks = content.sections
      .filter((section) => section.enabled && section.column === 0)
      .map((section) => {
        if (section.id === 'experience') return makeSectionContainer('experience', 'main', experienceParts);
        if (section.id === 'projects') return makeSectionContainer('projects', 'main', projectParts);
        return null;
      })
      .filter((b): b is LayoutBlock<ReactNode> => Boolean(b));

    const sidebarBlocks = content.sections
      .filter((section) => section.enabled && section.column === 1)
      .map((section) => {
        if (section.id === 'skills') return skillsBlock;
        if (section.id === 'social') return makeSectionContainer('social', 'sidebar', socialParts);
        if (section.id === 'education') return makeSectionContainer('education', 'sidebar', educationParts);
        if (section.id === 'trainingCourses') return makeSectionContainer('trainingCourses', 'sidebar', trainingParts);
        if (section.id === 'achievements') return makeSectionContainer('achievements', 'sidebar', achievementParts);
        return null;
      })
      .filter((b): b is LayoutBlock<ReactNode> => Boolean(b));

    return [
      { id: 'main', flow: 'vertical', blocks: mainBlocks },
      { id: 'sidebar', flow: 'vertical', blocks: sidebarBlocks },
    ];
  },

  renderPage(page, headerBlock) {
    return (
      <ResumePage page={classicTemplate.page}>
        <div className="resumeBackground">
          <div className="resumeBody">
            {page.index === 0 && headerBlock && (
              <div className="layoutBlock" data-layout-block="header">
                {headerBlock.content}
              </div>
            )}
            <div className="resumeInfoBody">
              {page.regions.map((region) => (
                <div className="resumeBodyCol" key={region.id}>
                  <ResumeRegion id={region.id}>
                    {region.blocks.map((item) => (
                      <Fragment key={item.id}>{renderLayoutBlock(item)}</Fragment>
                    ))}
                  </ResumeRegion>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ResumePage>
    );
  },
};

// ─── Self-register ────────────────────────────────────────────────────────────

registerTemplateAdapter(classicAdapterImpl);

export { classicAdapterImpl as classicAdapter };
