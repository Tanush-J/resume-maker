import classes from './buildResume.module.css';
import MainResume from './mainResume.tsx';
import { useEffect, useState, type CSSProperties } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase';
import { loadOrCreateResume, saveResume } from './resumeRepository';
import {
  createEmptySectionItem,
  type ResumeDocument,
  type ResumeSectionId,
  type ResumeSection,
  type SkillsSection,
  sectionById,
} from './resumeModel';
import type { SerializedLayoutPlan } from './layout';
import { generateResumePdf } from './pdfService';
import ResumeEditorPopover, { type EditorSelection } from './resumeEditorPopover';
import {
  Alert,
  Button,
  Card,
  Flex,
  Modal,
  Select,
  Space,
  Switch,
  Typography,
  message,
} from 'antd';
import {
  CloseOutlined,
  DragOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  PlusOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/** One sortable row in the Sections card. */
const SortableSectionRow = ({
  section,
  onToggle,
  onAddItem,
  onRegionChange,
}: {
  section: ResumeSection;
  onToggle: () => void;
  onAddItem: () => void;
  onRegionChange: (column: 0 | 1) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    padding: '4px 0',
  };

  return (
    <Flex ref={setNodeRef} style={style} gap={8} align="center">
      <Button
        size="small"
        type="text"
        icon={<DragOutlined />}
        {...attributes}
        {...listeners}
        aria-label={`Drag ${section.name} to reorder`}
        style={{ cursor: 'grab', touchAction: 'none' }}
      />
      <Switch checked={section.enabled} onChange={onToggle} size="small" />
      <Typography.Text strong style={{ flex: 1, minWidth: 120 }}>
        {section.name}
        {section.column === 1 ? ' (sidebar)' : ''}
      </Typography.Text>
      <Button size="small" icon={<PlusOutlined />} onClick={onAddItem} aria-label={`Add item to ${section.name}`} />
      <Select
        value={section.column}
        style={{ width: 98 }}
        size="small"
        options={[
          { value: 0, label: 'Main' },
          { value: 1, label: 'Sidebar' },
        ]}
        onChange={onRegionChange}
      />
    </Flex>
  );
};

const BuildResume = () => {
  const [resume, setResume] = useState<ResumeDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [editorSelection, setEditorSelection] = useState<EditorSelection | null>(null);
  const [layoutPlan, setLayoutPlan] = useState<SerializedLayoutPlan | null>(null);

  // Drag sensor: require a small movement before a drag starts so plain
  // clicks on the row's buttons still work reliably.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  // Sections in document order (the array order IS the render order).
  const orderedSections = resume?.content.sections ?? [];

  useEffect(() => () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
  }, [pdfUrl]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setError('Your session has expired. Please sign in again.');
        setIsLoading(false);
        return;
      }

      loadOrCreateResume(user.uid)
        .then(setResume)
        .catch((loadError: unknown) => {
          const errorCode = loadError instanceof Error && 'code' in loadError
            ? String(loadError.code)
            : 'unknown';
          console.error('Unable to load resume:', loadError);
          setError(`Unable to load your resume (${errorCode}).`);
        })
        .finally(() => setIsLoading(false));
    });

    return unsubscribe;
  }, []);

  const saveCurrentResume = async () => {
    if (!resume) return;

    await saveResume(resume);
  };

  const updateResumeValue = (path: string, value: string) => {
    setResume((currentResume) => {
      if (!currentResume) return currentResume;

      const updatedResume = structuredClone(currentResume) as ResumeDocument;
      const pathParts = path.split('.');
      let target: Record<string, unknown> = updatedResume.content as unknown as Record<string, unknown>;

      pathParts.slice(0, -1).forEach((part) => {
        const nextTarget = target[part];
        if (typeof nextTarget === 'object' && nextTarget !== null) {
          target = nextTarget as Record<string, unknown>;
        }
      });

      target[pathParts[pathParts.length - 1]] = value;
      return updatedResume;
    });
  };

  const toggleSectionEnabled = (sectionId: string) => {
    setResume((currentResume) => {
      if (!currentResume) return currentResume;
      const updatedResume = structuredClone(currentResume) as ResumeDocument;
      const section = sectionById(updatedResume.content.sections, sectionId as ResumeSectionId);
      if (section) section.enabled = !section.enabled;
      return updatedResume;
    });
  };

  const moveSectionRegion = (sectionId: string, column: 0 | 1) => {
    setResume((currentResume) => {
      if (!currentResume) return currentResume;
      const updatedResume = structuredClone(currentResume) as ResumeDocument;
      const section = sectionById(updatedResume.content.sections, sectionId as ResumeSectionId);
      if (section) section.column = column;
      return updatedResume;
    });
  };

  /**
   * Reorder sections after a drag-and-drop. `activeId` and `overId` are
   * section ids; the `sections[]` array order is the render order.
   */
  const reorderSections = (activeId: string, overId: string) => {
    setResume((currentResume) => {
      if (!currentResume || activeId === overId) return currentResume;
      const updatedResume = structuredClone(currentResume) as ResumeDocument;
      const sections = updatedResume.content.sections;

      const fromIndex = sections.findIndex((s) => s.id === activeId);
      const toIndex = sections.findIndex((s) => s.id === overId);
      if (fromIndex < 0 || toIndex < 0) return updatedResume;

      const reordered = arrayMove(sections, fromIndex, toIndex);
      updatedResume.content.sections = reordered;
      return updatedResume;
    });
  };

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    reorderSections(String(active.id), String(over.id));
  };

  // ── Item CRUD helpers ──────────────────────────────────────────────────────
  // These operate on the generic `sections[]` arrays. Skills are stored as
  // `SkillItem` objects with a `tags` list, so add/remove there edits `tags`.

  const getItemArray = (content: ResumeDocument['content'], sectionId: ResumeSectionId): unknown[] => {
    const section = sectionById(content.sections, sectionId);
    return (section?.items ?? []) as unknown[];
  };

  const getSkillTags = (content: ResumeDocument['content']): string[] => {
    const skills = sectionById(content.sections, 'skills') as SkillsSection | undefined;
    const first = skills?.items?.[0];
    return first?.tags ?? [];
  };

  const addSectionItem = (sectionId: ResumeSectionId) => {
    if (!resume) return;

    // Generate the id up-front so the popover can target the exact new item.
    const newId = `${sectionId}-${Date.now().toString(36)}`;

    setResume((currentResume) => {
      if (!currentResume) return currentResume;
      const updatedResume = structuredClone(currentResume) as ResumeDocument;

      if (sectionId === 'skills') {
        const skills = sectionById(updatedResume.content.sections, 'skills') as SkillsSection | undefined;
        if (skills && skills.items.length === 0) skills.items.push({ id: 'skills-default', tags: [] });
        skills?.items?.[0]?.tags?.push('');
      } else {
        const items = getItemArray(updatedResume.content, sectionId);
        const newItem = createEmptySectionItem(sectionId as Exclude<ResumeSectionId, 'skills'>, newId);
        items.push(newItem);
      }
      return updatedResume;
    });

    // Open the editor for the freshly added item so the user can fill it in.
    if (sectionId !== 'skills') {
      const openSelection: EditorSelection =
        sectionId === 'experience' ? { type: 'experience', id: newId }
        : sectionId === 'projects' ? { type: 'project', id: newId }
        : sectionId === 'social' ? { type: 'social', id: newId }
        : sectionId === 'education' ? { type: 'education', id: newId }
        : sectionId === 'trainingCourses' ? { type: 'trainingCourse', id: newId }
        : { type: 'achievement', id: newId };
      requestAnimationFrame(() => setEditorSelection(openSelection));
    }
  };

  const removeSectionItem = (sectionId: ResumeSectionId, itemId: string | number) => {
    setResume((currentResume) => {
      if (!currentResume) return currentResume;
      const updatedResume = structuredClone(currentResume) as ResumeDocument;

      if (sectionId === 'skills') {
        const tags = getSkillTags(updatedResume.content);
        const index = itemId as number;
        if (index >= 0 && index < tags.length) tags.splice(index, 1);
      } else {
        const items = getItemArray(updatedResume.content, sectionId);
        const index = (items as Array<{ id: string }>).findIndex((item) => item.id === itemId);
        if (index >= 0) items.splice(index, 1);
      }
      return updatedResume;
    });
  };

  const moveSectionItem = (sectionId: ResumeSectionId, itemId: string | number, direction: 'up' | 'down') => {
    setResume((currentResume) => {
      if (!currentResume) return currentResume;
      const updatedResume = structuredClone(currentResume) as ResumeDocument;

      let index = -1;
      let items: unknown[] = [];
      if (sectionId === 'skills') {
        items = getSkillTags(updatedResume.content) as unknown as unknown[];
        index = itemId as number;
      } else {
        items = getItemArray(updatedResume.content, sectionId);
        index = (items as Array<{ id: string }>).findIndex((item) => item.id === itemId);
      }

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (index < 0 || targetIndex < 0 || targetIndex >= items.length) return updatedResume;
      [items[index], items[targetIndex]] = [items[targetIndex], items[index]];
      return updatedResume;
    });
  };

  // Map an editor selection to its section id + item index/id so the popover's
  // delete/move callbacks can act on the data model directly.
  const selectionToSection = (selection: EditorSelection): { sectionId: ResumeSectionId; itemId: string | number } | null => {
    switch (selection.type) {
      case 'experience': return { sectionId: 'experience', itemId: selection.id };
      case 'project': return { sectionId: 'projects', itemId: selection.id };
      case 'skill': return { sectionId: 'skills', itemId: selection.index };
      case 'social': return { sectionId: 'social', itemId: selection.id };
      case 'education': return { sectionId: 'education', itemId: selection.id };
      case 'trainingCourse': return { sectionId: 'trainingCourses', itemId: selection.id };
      case 'achievement': return { sectionId: 'achievements', itemId: selection.id };
      case 'header': return null;
    }
  };

  const handleDeleteSelection = (selection: EditorSelection) => {
    const mapped = selectionToSection(selection);
    if (!mapped || !resume) { setEditorSelection(null); return; }
    removeSectionItem(mapped.sectionId, mapped.itemId);
    setEditorSelection(null);
    void message.success('Item deleted');
  };

  const handleMoveSelection = (selection: EditorSelection, direction: 'up' | 'down') => {
    const mapped = selectionToSection(selection);
    if (!mapped || !resume) return;
    moveSectionItem(mapped.sectionId, mapped.itemId, direction);
  };

  const generatePdf = async () => {
    if (!resume) return;

    // Clear stale preview state before starting a new render,
    // so the user never sees the previous PDF while loading.
    setIsPdfPreviewOpen(false);
    setPdfUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return null;
    });
    setIsPdfLoading(true);
    setPdfError(null);

    try {
      const pdfBlob = await generateResumePdf(resume, layoutPlan);
      setPdfUrl((currentUrl) => {
        if (currentUrl) URL.revokeObjectURL(currentUrl);
        return URL.createObjectURL(pdfBlob);
      });
      setIsPdfPreviewOpen(true);
    } catch (pdfGenerationError) {
      setPdfError(pdfGenerationError instanceof Error ? pdfGenerationError.message : 'Unable to generate PDF.');
    } finally {
      setIsPdfLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading resume...</div>;
  }

  if (error || !resume) {
    return <div>{error ?? 'Resume unavailable.'}</div>;
  }

  return (
      <>
          <div className="no-print" style={{ maxWidth: 960, margin: '0 auto', padding: '1rem 1.5rem' }}>
            <Flex vertical gap={16}>
              <Flex gap={12} wrap="wrap" align="center">
                <Button
                  type="primary"
                  icon={<FilePdfOutlined />}
                  onClick={generatePdf}
                  loading={isPdfLoading}
                >
                  {isPdfLoading ? 'Preparing PDF...' : 'Preview PDF'}
                </Button>
                <Button icon={<SaveOutlined />} onClick={saveCurrentResume}>
                  Save
                </Button>
                {pdfUrl && (
                  <Button icon={<DownloadOutlined />} href={pdfUrl} download={`${resume.name || 'resume'}.pdf`}>
                    Download PDF
                  </Button>
                )}
              </Flex>

              {pdfError && <Alert type="error" showIcon message={pdfError} closable onClose={() => setPdfError(null)} />}
              {layoutPlan?.pages.some((page) => page.regions.some((region) => region.overflowedBlockIds.length > 0)) && (
                <Alert
                  type="warning"
                  showIcon
                  message="Some content is taller than one page and may need shortening."
                />
              )}

              <Card
                title="Sections — drag to reorder"
                size="small"
                styles={{ body: { paddingBottom: 4 } }}
              >
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
                  <SortableContext items={orderedSections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                    <Flex vertical gap={4}>
                      {orderedSections.map((section) => (
                        <SortableSectionRow
                          key={section.id}
                          section={section}
                          onToggle={() => toggleSectionEnabled(section.id)}
                          onAddItem={() => addSectionItem(section.id)}
                          onRegionChange={(column) => moveSectionRegion(section.id, column)}
                        />
                      ))}
                    </Flex>
                  </SortableContext>
                </DndContext>
              </Card>
            </Flex>
          </div>
          <div className={classes.container}>
            <MainResume
              resume={resume}
              onChange={updateResumeValue}
              onSelectEditor={setEditorSelection}
              onLayoutPlanChange={setLayoutPlan}
            />
          </div>
          {isPdfPreviewOpen && pdfUrl && (
            <Modal
              open={isPdfPreviewOpen}
              onCancel={() => setIsPdfPreviewOpen(false)}
              footer={null}
              width="90%"
              styles={{ body: { padding: 0, height: 'calc(100vh - 130px)' } }}
              title={
                <Flex align="center" justify="space-between">
                  <Typography.Text strong>PDF preview</Typography.Text>
                  <Space>
                    <Button size="small" icon={<DownloadOutlined />} href={pdfUrl} download={`${resume.name || 'resume'}.pdf`}>
                      Download
                    </Button>
                    <Button size="small" icon={<CloseOutlined />} onClick={() => setIsPdfPreviewOpen(false)}>
                      Close
                    </Button>
                  </Space>
                </Flex>
              }
            >
              <iframe
                title="Generated resume PDF"
                src={pdfUrl}
                style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
              />
            </Modal>
          )}
          {editorSelection && (
            <ResumeEditorPopover
              resume={resume}
              selection={editorSelection}
              onChange={updateResumeValue}
              onClose={() => setEditorSelection(null)}
              onDeleteItem={handleDeleteSelection}
              onMoveItem={handleMoveSelection}
            />
          )}
      </>
  )
}

export default BuildResume;