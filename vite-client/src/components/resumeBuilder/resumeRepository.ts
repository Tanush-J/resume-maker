import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';

import { auth, db } from '../../firebase';
import {
  createDefaultResume,
  getDefaultResumeContent,
  type ResumeDocument,
  type ResumeContent,
} from './resumeModel';

import {
  SECTION_RECORDS,
  type ResumeSection,
  type SectionColumn,
} from './resumeModel';

export const MAX_RESUME_NAME_LENGTH = 30;

const migrateV1ToV2 = (raw: Record<string, unknown>): ResumeDocument => {
  const content = (raw.content ?? {}) as Record<string, unknown>;
  const configuration = (raw.configuration ?? {}) as Record<string, unknown>;
  const placements = (configuration.placements ?? []) as Array<Record<string, unknown>>;

  const placementFor = (id: string) => placements.find((p) => p.sectionId === id);

  const sectionOrder = [
    'experience',
    'projects',
    'skills',
    'social',
    'education',
    'trainingCourses',
    'achievements',
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

const verifyAuthenticatedOwner = (ownerId: string): string => {
  const currentUid = auth.currentUser?.uid;
  if (!currentUid) {
    const error = new Error('Authentication required.') as Error & { code?: string };
    error.code = 'auth/unauthenticated';
    throw error;
  }
  if (!ownerId || currentUid !== ownerId) {
    const error = new Error('Unauthorized access: ownerId mismatch.') as Error & { code?: string };
    error.code = 'permission-denied';
    throw error;
  }
  return currentUid;
};

const resumeReference = (ownerId: string, resumeId: string) =>
  doc(db, 'users', ownerId, 'resumes', resumeId);

const resumesCollection = (ownerId: string) => collection(db, 'users', ownerId, 'resumes');

const normalizeResumeName = (name: string): string => name.trim();

const mapV1DocumentToV2 = (data: Record<string, unknown>): ResumeDocument => {
  // Keep existing migration behavior by delegating to migrateV1ToV2.
  // This ensures separation of concerns stays aligned with the plan.
  return migrateV1ToV2(data);
};

const loadResumeDocument = async (ownerId: string, resumeId: string): Promise<ResumeDocument> => {
  const verifiedUid = verifyAuthenticatedOwner(ownerId);
  const snapshot = await getDoc(resumeReference(verifiedUid, resumeId));

  if (!snapshot.exists()) {
    const error = new Error(`Resume "${resumeId}" not found.`) as Error & { code?: string };
    error.code = 'resume/not-found';
    throw error;
  }

  const data = snapshot.data() as Record<string, unknown>;

  const isV1 =
    data.schemaVersion !== 2 &&
    (data.configuration || (data.content as Record<string, unknown> | undefined)?.headerSection);

  if (isV1) {
    const migrated = mapV1DocumentToV2(data);
    await setDoc(resumeReference(verifiedUid, resumeId), migrated);
    return migrated;
  }

  return data as unknown as ResumeDocument;
};

export const getResume = async (ownerId: string, resumeId: string): Promise<ResumeDocument> =>
  loadResumeDocument(ownerId, resumeId);

export const listResumes = async (ownerId: string): Promise<ResumeDocument[]> => {
  const verifiedUid = verifyAuthenticatedOwner(ownerId);
  const snapshot = await getDocs(resumesCollection(verifiedUid));
  return snapshot.docs.map((docSnap) => docSnap.data() as ResumeDocument);
};

export const loadOrCreateResume = async (ownerId: string, resumeId = 'default'): Promise<ResumeDocument> => {
  const verifiedUid = verifyAuthenticatedOwner(ownerId);
  const snapshot = await getDoc(resumeReference(verifiedUid, resumeId));

  if (snapshot.exists()) {
    const data = snapshot.data() as Record<string, unknown>;
    const isV1 =
      data.schemaVersion !== 2 &&
      (data.configuration || (data.content as Record<string, unknown> | undefined)?.headerSection);

    if (isV1) {
      const migrated = mapV1DocumentToV2(data);
      await setDoc(resumeReference(verifiedUid, resumeId), migrated);
      return migrated;
    }

    return data as unknown as ResumeDocument;
  }

  const content: ResumeContent = await getDefaultResumeContent();
  const resume = createDefaultResume(verifiedUid, content);
  await setDoc(resumeReference(verifiedUid, resumeId), resume);
  return resume;
};

export const saveResume = async (resume: ResumeDocument): Promise<void> => {
  const verifiedUid = verifyAuthenticatedOwner(resume.ownerId);
  if (!resume.id) {
    throw new Error('Resume ID is required for saving.');
  }

  await setDoc(resumeReference(verifiedUid, resume.id), {
    ...resume,
    ownerId: verifiedUid,
    updatedAt: new Date().toISOString(),
  });
};

export const createResume = async (
  ownerId: string,
  templateId: string,
  templateVersion = 1,
): Promise<ResumeDocument> => {
  const verifiedUid = verifyAuthenticatedOwner(ownerId);
  const reference = doc(resumesCollection(verifiedUid));

  const content = await getDefaultResumeContent();

  const resume: ResumeDocument = {
    ...createDefaultResume(verifiedUid, content),
    id: reference.id,
    ownerId: verifiedUid,
    templateId,
    templateVersion,
  };

  await setDoc(reference, resume);
  return resume;
};

export const deleteResume = async (ownerId: string, resumeId: string): Promise<void> => {
  const verifiedUid = verifyAuthenticatedOwner(ownerId);
  await deleteDoc(resumeReference(verifiedUid, resumeId));
};

export const renameResume = async (ownerId: string, resumeId: string, name: string): Promise<void> => {
  const verifiedUid = verifyAuthenticatedOwner(ownerId);

  const normalized = normalizeResumeName(name);
  const maxLength = MAX_RESUME_NAME_LENGTH ?? 30;

  if (!normalized) {
    const error = new Error('Resume name cannot be empty.') as Error & { code?: string };
    error.code = 'validation/empty-name';
    throw error;
  }

  if (normalized.length > maxLength) {
    const error = new Error(`Resume name must be at most ${maxLength} characters.`) as Error & { code?: string };
    error.code = 'validation/name-too-long';
    throw error;
  }

  await updateDoc(resumeReference(verifiedUid, resumeId), {
    name: normalized,
    updatedAt: new Date().toISOString(),
  });
};
