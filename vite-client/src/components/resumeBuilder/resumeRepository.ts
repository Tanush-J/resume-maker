import { doc, getDoc, setDoc } from 'firebase/firestore';

import { db } from '../../firebase';
import {
  createDefaultResume,
  defaultResumeContent,
  SECTION_RECORDS,
  type ResumeDocument,
  type ResumeSection,
  type SectionColumn,
} from './resumeModel';

const resumeReference = (ownerId: string, resumeId: string) =>
  doc(db, 'users', ownerId, 'resumes', resumeId);

/**
 * Migrate a v1 document (flat `content.*Section` fields + `configuration`)
 * into the v2 generic `sections[]` shape. Pure function — callers decide
 * whether to persist the result.
 */
const migrateV1ToV2 = (raw: Record<string, unknown>): ResumeDocument => {
  const content = (raw.content ?? {}) as Record<string, unknown>;
  const configuration = (raw.configuration ?? {}) as Record<string, unknown>;
  const placements = (configuration.placements ?? []) as Array<Record<string, unknown>>;

  const placementFor = (id: string) => placements.find((p) => p.sectionId === id);

  // Build generic sections in the canonical order, preserving v1 placement.
  const sectionOrder = [
    'experience', 'projects', 'skills', 'social', 'education', 'trainingCourses', 'achievements',
  ];

  const sections: ResumeSection[] = sectionOrder.map((id) => {
    const placement = placementFor(id);
    const regionId = placement?.regionId as 'main' | 'sidebar' | undefined;
    const column = (regionId === 'sidebar' ? 1 : 0) as SectionColumn;
    const enabled = (placement?.visible ?? true) as boolean;
    const record = SECTION_RECORDS[id as keyof typeof SECTION_RECORDS];

    let items: unknown[] = [];
    if (id === 'skills') {
      const tags = (content.skillsSection ?? []) as string[];
      items = [{ id: 'skills-default', tags }];
    } else {
      const flatField = `${id}Section`;
      items = (content[flatField] ?? []) as unknown[];
    }

    return {
      id,
      record,
      enabled,
      column,
      name: id,
      items,
    } as ResumeSection;
  });

  const header = (content.headerSection ?? {}) as Record<string, unknown>;

  return {
    schemaVersion: 2,
    id: (raw.id as string) ?? 'default',
    ownerId: (raw.ownerId as string) ?? '',
    name: (raw.name as string) ?? 'My Resume',
    templateId: (raw.templateId as string) ?? 'classic',
    templateVersion: (raw.templateVersion as number) ?? 1,
    content: {
      header: {
        name: (header.name as string) ?? '',
        contact: (header.contact as string) ?? '',
        email: (header.email as string) ?? '',
        link: (header.link as string) ?? '',
        location: (header.location as string) ?? '',
      },
      sections,
    },
    createdAt: (raw.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (raw.updatedAt as string) ?? new Date().toISOString(),
  };
};

export const loadOrCreateResume = async (
  ownerId: string,
  resumeId = 'default',
): Promise<ResumeDocument> => {
  const snapshot = await getDoc(resumeReference(ownerId, resumeId));

  if (snapshot.exists()) {
    const data = snapshot.data() as Record<string, unknown>;
    // Detect v1 documents (which had a `configuration` object + flat content fields).
    const isV1 = data.schemaVersion !== 2 && (data.configuration || (data.content as Record<string, unknown>)?.headerSection);
    if (isV1) {
      const migrated = migrateV1ToV2(data);
      await setDoc(resumeReference(ownerId, resumeId), migrated);
      return migrated;
    }
    return data as unknown as ResumeDocument;
  }

  const resume = createDefaultResume(ownerId, defaultResumeContent);
  await setDoc(resumeReference(ownerId, resumeId), resume);
  return resume;
};

export const saveResume = async (resume: ResumeDocument): Promise<void> => {
  await setDoc(resumeReference(resume.ownerId, resume.id), {
    ...resume,
    updatedAt: new Date().toISOString(),
  });
};