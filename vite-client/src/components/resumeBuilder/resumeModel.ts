// ─── Header ───────────────────────────────────────────────────────────────────

export interface ResumeHeader {
  name: string;
  /** Professional headline / job title shown under the name (optional). */
  title?: string;
  contact: string;
  email: string;
  link: string;
  location: string;
}

// ─── Item shapes (nested under each generic section) ─────────────────────────

export interface ExperienceItem {
  id: string;
  designation: string;
  company: string;
  start: string;
  end: string;
  location: string;
  link?: string;
  description: string[];
}

export interface ProjectItem {
  id: string;
  title: string;
  link: string;
  description: string[];
  show: boolean;
}

export interface SkillItem {
  /** Skills are stored as a tag list, mirroring Enhancv's TechnologyItem. */
  id: string;
  tags: string[];
}

export interface SocialItem {
  id: string;
  icon: string;
  name: string;
  link: string;
}

export interface EducationItem {
  id: string;
  degree: string;
  location: string;
  start: string;
  end: string;
  gpa: {
    type: string;
    score: string;
    outOf: string;
  };
  show: boolean;
}

export interface TrainingCourseItem {
  id: string;
  title: string;
  link: string;
  description: string;
  show: boolean;
}

export interface AchievementItem {
  id: string;
  title: string;
  link: string;
  description: string;
}

export interface SummaryItem {
  id: string;
  /** Free-flowing professional summary text (single block). */
  text: string;
}

// ─── Generic section array (Enhancv-style) ───────────────────────────────────

/** Canonical section ids used by the editor, controls, and templates. */
export type ResumeSectionId =
  | 'summary'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'social'
  | 'education'
  | 'trainingCourses'
  | 'achievements';

/** Enhancv-parity `record` discriminator for each section type. */
export type SectionRecord =
  | 'SummarySection'
  | 'ExperienceSection'
  | 'ProjectsSection'
  | 'SkillsSection'
  | 'SocialSection'
  | 'EducationSection'
  | 'TrainingCoursesSection'
  | 'AchievementsSection';

/** Layout column: 0 = main, 1 = sidebar. */
export type SectionColumn = 0 | 1;

/** Shared fields present on every entry of the generic `sections[]` array. */
interface BaseResumeSection {
  id: ResumeSectionId;
  /** Stable type discriminator; templates key their renderers on this. */
  record: SectionRecord;
  /** Whether the section is rendered/hidden. */
  enabled: boolean;
  /** Layout column: 0 = main, 1 = sidebar. */
  column: SectionColumn;
  /** Human-friendly display name (used by editors/controls). */
  name: string;
}

export interface SummarySection extends BaseResumeSection {
  record: 'SummarySection';
  items: SummaryItem[];
}

export interface ExperienceSection extends BaseResumeSection {
  record: 'ExperienceSection';
  items: ExperienceItem[];
}

export interface ProjectsSection extends BaseResumeSection {
  record: 'ProjectsSection';
  items: ProjectItem[];
}

export interface SkillsSection extends BaseResumeSection {
  record: 'SkillsSection';
  items: SkillItem[];
}

export interface SocialSection extends BaseResumeSection {
  record: 'SocialSection';
  items: SocialItem[];
}

export interface EducationSection extends BaseResumeSection {
  record: 'EducationSection';
  items: EducationItem[];
}

export interface TrainingCoursesSection extends BaseResumeSection {
  record: 'TrainingCoursesSection';
  items: TrainingCourseItem[];
}

export interface AchievementsSection extends BaseResumeSection {
  record: 'AchievementsSection';
  items: AchievementItem[];
}

export type ResumeSection =
  | SummarySection
  | ExperienceSection
  | ProjectsSection
  | SkillsSection
  | SocialSection
  | EducationSection
  | TrainingCoursesSection
  | AchievementsSection;

// ─── Content ──────────────────────────────────────────────────────────────────

/**
 * Template-agnostic resume content.
 *
 * `sections[]` is a generic list: every template reads the entries it knows
 * via the `record` discriminator and ignores the rest. Adding a new section
 * type is additive — it never changes this interface.
 */
export interface ResumeContent {
  /** Header is a dedicated field (Enhancv keeps it outside sections too). */
  header: ResumeHeader;
  sections: ResumeSection[];
}

export type ResumeFontFamily = 'Inter' | 'Arial' | 'Georgia';

export interface ResumeDesignOverrides {
  pageMargin?: number;
  fontFamily?: ResumeFontFamily;
  fontSize?: number;
  lineHeight?: number;
  sectionSpacing?: number;
  itemSpacing?: number;
  sidebarWidth?: number;
  columnGap?: number;
}

export interface ResumeDocument {
  schemaVersion: 2;
  id: string;
  ownerId: string;
  name: string;
  templateId: string;
  templateVersion: number;
  /** Column/order/visibility live on each section; there is no separate config. */
  content: ResumeContent;
  designOverrides?: ResumeDesignOverrides;
  createdAt: string;
  updatedAt: string;
}

// ─── Section helpers ──────────────────────────────────────────────────────────

/** Map a section id to its Enhancv-parity `record` string. */
export const SECTION_RECORDS: Record<ResumeSectionId, SectionRecord> = {
  summary: 'SummarySection',
  experience: 'ExperienceSection',
  projects: 'ProjectsSection',
  skills: 'SkillsSection',
  social: 'SocialSection',
  education: 'EducationSection',
  trainingCourses: 'TrainingCoursesSection',
  achievements: 'AchievementsSection',
};

export const RECORD_TO_SECTION_ID: Record<SectionRecord, ResumeSectionId> = {
  SummarySection: 'summary',
  ExperienceSection: 'experience',
  ProjectsSection: 'projects',
  SkillsSection: 'skills',
  SocialSection: 'social',
  EducationSection: 'education',
  TrainingCoursesSection: 'trainingCourses',
  AchievementsSection: 'achievements',
};

/** Find a section in the generic array by its id. */
export const sectionById = (
  sections: ResumeSection[],
  id: ResumeSectionId,
): ResumeSection | undefined => sections.find((section) => section.id === id);

/** Find a section in the generic array by its `record` discriminator. */
export const sectionByRecord = (
  sections: ResumeSection[],
  record: SectionRecord,
): ResumeSection | undefined => sections.find((section) => section.record === record);

/** Items of a section, typed; empty when the section is absent. */
export const sectionItems = (
  sections: ResumeSection[],
  id: ResumeSectionId,
): unknown[] => sectionById(sections, id)?.items ?? [];

export const getDefaultResumeContent = async (): Promise<ResumeContent> => {
  if (import.meta.env.DEV) {
    const { developmentResumeContent } = await import('./defaultResume/developmentResume');
    return developmentResumeContent;
  }
  const { demoResumeContent } = await import('./defaultResume/demoResume');
  return demoResumeContent;
};

/**
 * Create a brand-new resume document for a user with the default content.
 */
export const createDefaultResume = (ownerId: string, content: ResumeContent): ResumeDocument => {
  const now = new Date().toISOString();

  return {
    schemaVersion: 2,
    id: 'default',
    ownerId,
    name: 'My Resume',
    templateId: 'classic',
    templateVersion: 1,
    content: structuredClone(content),
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Build a fresh, empty item for the given section with a stable id.
 * `skills` is handled separately because its section stores `SkillItem` objects.
 */
export const createEmptySectionItem = (
  sectionId: Exclude<ResumeSectionId, 'skills' | 'summary'>,
  id: string,
): ExperienceItem | ProjectItem | SocialItem | EducationItem | TrainingCourseItem | AchievementItem => {
  switch (sectionId) {
    case 'experience':
      return { id, designation: '', company: '', start: '', end: '', location: '', link: '', description: [''] };
    case 'projects':
      return { id, title: '', link: '', description: [''], show: true };
    case 'social':
      return { id, icon: 'fa-solid fa-link fa-xl', name: '', link: '' };
    case 'education':
      return { id, degree: '', location: '', start: '', end: '', gpa: { type: '', score: '', outOf: '' }, show: true };
    case 'trainingCourses':
      return { id, title: '', link: '', description: '', show: true };
    case 'achievements':
      return { id, title: '', link: '', description: '' };
  }
};