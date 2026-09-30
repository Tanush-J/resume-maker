import { useEffect } from 'react';
import { Form, Modal, Input, InputNumber, Space, Button, Popconfirm, Divider, Flex } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, CloseOutlined, DeleteOutlined, SaveOutlined, CloseCircleOutlined } from '@ant-design/icons';
import {
  sectionById,
  type ResumeDocument,
  type SummaryItem,
  type ExperienceItem,
  type ProjectItem,
  type SkillItem,
  type SocialItem,
  type EducationItem,
  type TrainingCourseItem,
  type AchievementItem,
} from './resumeModel';

type EditorSelection =
  | { type: 'header'; index?: number }
  | { type: 'summary'; id: string }
  | { type: 'experience'; id: string }
  | { type: 'project'; id: string }
  | { type: 'skill'; index: number }
  | { type: 'social'; id: string }
  | { type: 'education'; id: string }
  | { type: 'trainingCourse'; id: string }
  | { type: 'achievement'; id: string };

interface ResumeEditorPopoverProps {
  resume: ResumeDocument;
  selection: EditorSelection;
  onChange: (path: string, value: string) => void;
  onClose: () => void;
  onDeleteItem?: (selection: NonNullable<EditorSelection>) => void;
  onMoveItem?: (selection: NonNullable<EditorSelection>, direction: 'up' | 'down') => void;
}

const ResumeEditorPopover = ({ resume, selection, onChange, onClose, onDeleteItem, onMoveItem }: ResumeEditorPopoverProps) => {
  const summaryItems = (sectionById(resume.content.sections, 'summary')?.items ?? []) as SummaryItem[];
  const experienceItems = (sectionById(resume.content.sections, 'experience')?.items ?? []) as ExperienceItem[];
  const projectItems = (sectionById(resume.content.sections, 'projects')?.items ?? []) as ProjectItem[];
  const skillItems = (sectionById(resume.content.sections, 'skills')?.items ?? []) as SkillItem[];
  const socialItems = (sectionById(resume.content.sections, 'social')?.items ?? []) as SocialItem[];
  const educationItems = (sectionById(resume.content.sections, 'education')?.items ?? []) as EducationItem[];
  const trainingCourseItems = (sectionById(resume.content.sections, 'trainingCourses')?.items ?? []) as TrainingCourseItem[];
  const achievementItems = (sectionById(resume.content.sections, 'achievements')?.items ?? []) as AchievementItem[];

  const summaryIndex = selection.type === 'summary' && selection.id
    ? summaryItems.findIndex((item) => item.id === selection.id)
    : 0;
  const summary = summaryItems[summaryIndex];
  const experienceIndex = selection.type === 'experience' && selection.id
    ? experienceItems.findIndex((item) => item.id === selection.id)
    : 0;
  const experience = experienceItems[experienceIndex];
  const projectIndex = selection.type === 'project' && selection.id
    ? projectItems.findIndex((item) => item.id === selection.id)
    : 0;
  const project = projectItems[projectIndex];
  const skillIndex = selection.type === 'skill' ? selection.index : 0;
  const skill = skillItems[0]?.tags[skillIndex] ?? undefined;
  const socialIndex = selection.type === 'social' && selection.id
    ? socialItems.findIndex((item) => item.id === selection.id)
    : 0;
  const social = socialItems[socialIndex];
  const educationIndex = selection.type === 'education' && selection.id
    ? educationItems.findIndex((item) => item.id === selection.id)
    : 0;
  const education = educationItems[educationIndex];
  const trainingCourseIndex = selection.type === 'trainingCourse' && selection.id
    ? trainingCourseItems.findIndex((item) => item.id === selection.id)
    : 0;
  const trainingCourse = trainingCourseItems[trainingCourseIndex];
  const achievementIndex = selection.type === 'achievement' && selection.id
    ? achievementItems.findIndex((item) => item.id === selection.id)
    : 0;
  const achievement = achievementItems[achievementIndex];

  // Total items in the section (skills count = number of tags).
  const getCurrentItemCount = (): number => {
    switch (selection.type) {
      case 'summary': return summaryItems.length;
      case 'experience': return experienceItems.length;
      case 'project': return projectItems.length;
      case 'skill': return skillItems[0]?.tags.length ?? 0;
      case 'social': return socialItems.length;
      case 'education': return educationItems.length;
      case 'trainingCourse': return trainingCourseItems.length;
      case 'achievement': return achievementItems.length;
      default: return 0;
    }
  };

  const getCurrentItemIndex = (): number => {
    switch (selection.type) {
      case 'summary': return summaryIndex;
      case 'experience': return experienceIndex;
      case 'project': return projectIndex;
      case 'skill': return skillIndex;
      case 'social': return socialIndex;
      case 'education': return educationIndex;
      case 'trainingCourse': return trainingCourseIndex;
      case 'achievement': return achievementIndex;
      default: return 0;
    }
  };

  const itemCount = getCurrentItemCount();
  const itemIndex = getCurrentItemIndex();
  const canMoveUp = selection.type !== 'header' && itemIndex > 0;
  const canMoveDown = selection.type !== 'header' && itemIndex >= 0 && itemIndex < itemCount - 1;

  const [form] = Form.useForm();

  useEffect(() => {
    if (selection.type === 'header') {
      form.setFieldsValue({
        name: resume.content.header.name,
        title: resume.content.header.title ?? '',
        contact: resume.content.header.contact,
        email: resume.content.header.email,
        link: resume.content.header.link,
        location: resume.content.header.location,
      });
    } else if (selection.type === 'summary' && summary) {
      form.setFieldsValue({ text: summary.text });
    } else if (selection.type === 'experience' && experience) {
      form.setFieldsValue({
        designation: experience.designation,
        company: experience.company,
        start: experience.start,
        end: experience.end,
        location: experience.location,
        description: experience.description.join('\n'),
      });
    } else if (selection.type === 'project' && project) {
      form.setFieldsValue({
        title: project.title,
        link: project.link,
        description: project.description.join('\n'),
      });
    } else if (selection.type === 'skill' && skill) {
      form.setFieldsValue({ skill });
    } else if (selection.type === 'social' && social) {
      form.setFieldsValue({ icon: social.icon, name: social.name, link: social.link });
    } else if (selection.type === 'education' && education) {
      form.setFieldsValue({
        degree: education.degree,
        location: education.location,
        start: education.start,
        end: education.end,
        gpaType: education.gpa.type,
        gpaScore: education.gpa.score,
        gpaOutOf: education.gpa.outOf,
      });
    } else if (selection.type === 'trainingCourse' && trainingCourse) {
      form.setFieldsValue({ title: trainingCourse.title, link: trainingCourse.link, description: trainingCourse.description });
    } else if (selection.type === 'achievement' && achievement) {
      form.setFieldsValue({ title: achievement.title, link: achievement.link, description: achievement.description });
    }
  }, [resume, selection, summary, experience, project, skill, social, education, trainingCourse, achievement, form]);

  const getSectionTitle = () => {
    switch (selection.type) {
      case 'header': return 'Edit header';
      case 'summary': return 'Edit summary';
      case 'experience': return 'Edit experience';
      case 'project': return 'Edit project';
      case 'skill': return 'Edit skill';
      case 'social': return 'Edit social link';
      case 'education': return 'Edit education';
      case 'trainingCourse': return 'Edit training course';
      case 'achievement': return 'Edit achievement';
    }
  };

  const getPrefix = () => {
    switch (selection.type) {
      case 'header': return 'header';
      case 'summary': return `sections.${resume.content.sections.findIndex((s) => s.id === 'summary')}.items.${summaryIndex}`;
      case 'experience': return `sections.${resume.content.sections.findIndex((s) => s.id === 'experience')}.items.${experienceIndex}`;
      case 'project': return `sections.${resume.content.sections.findIndex((s) => s.id === 'projects')}.items.${projectIndex}`;
      case 'skill': return `sections.${resume.content.sections.findIndex((s) => s.id === 'skills')}.items.0.tags.${skillIndex}`;
      case 'social': return `sections.${resume.content.sections.findIndex((s) => s.id === 'social')}.items.${socialIndex}`;
      case 'education': return `sections.${resume.content.sections.findIndex((s) => s.id === 'education')}.items.${educationIndex}`;
      case 'trainingCourse': return `sections.${resume.content.sections.findIndex((s) => s.id === 'trainingCourses')}.items.${trainingCourseIndex}`;
      case 'achievement': return `sections.${resume.content.sections.findIndex((s) => s.id === 'achievements')}.items.${achievementIndex}`;
    }
  };

  const handleFinish = async (values: Record<string, string>) => {
    const prefix = getPrefix();

    if (selection.type === 'experience' || selection.type === 'project') {
      const lines = (values.description || '').split('\n');
      lines.forEach((item, index) => onChange(`${prefix}.description.${index}`, item));
    } else if (selection.type === 'education') {
      onChange(`${prefix}.gpa.type`, values.gpaType || '');
      onChange(`${prefix}.gpa.score`, values.gpaScore || '');
      onChange(`${prefix}.gpa.outOf`, values.gpaOutOf || '');
    }

    Object.entries(values).forEach(([field, value]) => {
      if (field === 'description' && (selection.type === 'experience' || selection.type === 'project')) return;
      if (selection.type === 'education' && field.startsWith('gpa')) return;
      onChange(`${prefix}.${field}`, value);
    });

    onClose();
  };

  const handleDelete = () => {
    onDeleteItem?.(selection);
    onClose();
  };

  if (
    (selection.type === 'summary' && !summary) ||
    (selection.type === 'experience' && !experience) ||
    (selection.type === 'project' && !project) ||
    (selection.type === 'skill' && !skill) ||
    (selection.type === 'social' && !social) ||
    (selection.type === 'education' && !education) ||
    (selection.type === 'trainingCourse' && !trainingCourse) ||
    (selection.type === 'achievement' && !achievement)
  ) return null;

  return (
    <Modal
      open={true}
      title={getSectionTitle()}
      onCancel={onClose}
      footer={null}
      width={520}
      destroyOnHidden
      centered
      closeIcon={<CloseCircleOutlined />}
      style={{ top: 100 }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={form.getFieldsValue()}
        autoComplete="off"
      >
        {selection.type === 'header' && (
          <>
            <Form.Item label="Name" name="name">
              <Input />
            </Form.Item>
            <Form.Item label="Job title" name="title">
              <Input placeholder="e.g. Full Stack Developer" />
            </Form.Item>
            <Form.Item label="Phone" name="contact">
              <Input />
            </Form.Item>
            <Form.Item label="Email" name="email">
              <Input type="email" />
            </Form.Item>
            <Form.Item label="LinkedIn" name="link">
              <Input />
            </Form.Item>
            <Form.Item label="Location" name="location">
              <Input />
            </Form.Item>
          </>
        )}

        {selection.type === 'summary' && (
          <Form.Item label="Summary" name="text">
            <Input.TextArea rows={6} placeholder="Professional summary..." />
          </Form.Item>
        )}

        {selection.type === 'experience' && (
          <>
            <Form.Item label="Job title" name="designation">
              <Input />
            </Form.Item>
            <Form.Item label="Company" name="company">
              <Input />
            </Form.Item>
            <Form.Item label="Start" name="start">
              <Input />
            </Form.Item>
            <Form.Item label="End" name="end">
              <Input />
            </Form.Item>
            <Form.Item label="Location" name="location">
              <Input />
            </Form.Item>
            <Form.Item label="Bullet points" name="description">
              <Input.TextArea rows={7} placeholder="One bullet per line" />
            </Form.Item>
          </>
        )}

        {selection.type === 'project' && (
          <>
            <Form.Item label="Project title" name="title">
              <Input />
            </Form.Item>
            <Form.Item label="Link" name="link">
              <Input placeholder="https://..." />
            </Form.Item>
            <Form.Item label="Description bullets" name="description">
              <Input.TextArea rows={7} placeholder="One bullet per line" />
            </Form.Item>
          </>
        )}

        {selection.type === 'skill' && (
          <Form.Item label="Skill" name="skill">
            <Input />
          </Form.Item>
        )}

        {selection.type === 'social' && (
          <>
            <Form.Item label="Icon class" name="icon" help="e.g. fa-brands fa-github fa-xl">
              <Input />
            </Form.Item>
            <Form.Item label="Name" name="name">
              <Input />
            </Form.Item>
            <Form.Item label="Link" name="link">
              <Input />
            </Form.Item>
          </>
        )}

        {selection.type === 'education' && (
          <>
            <Form.Item label="Degree" name="degree">
              <Input />
            </Form.Item>
            <Form.Item label="Institution" name="location">
              <Input />
            </Form.Item>
            <Form.Item label="Start" name="start">
              <Input />
            </Form.Item>
            <Form.Item label="End" name="end">
              <Input />
            </Form.Item>
            <Divider dashed>GPA / Score</Divider>
            <Form.Item label="Type" name="gpaType">
              <Input placeholder="CGPA, Percentage, etc." />
            </Form.Item>
            <Form.Item label="Score" name="gpaScore">
              <InputNumber precision={2} />
            </Form.Item>
            <Form.Item label="Out of" name="gpaOutOf">
              <InputNumber />
            </Form.Item>
          </>
        )}

        {selection.type === 'trainingCourse' && (
          <>
            <Form.Item label="Course title" name="title">
              <Input />
            </Form.Item>
            <Form.Item label="Link" name="link">
              <Input placeholder="https://..." />
            </Form.Item>
            <Form.Item label="Description" name="description">
              <Input.TextArea rows={5} />
            </Form.Item>
          </>
        )}

        {selection.type === 'achievement' && (
          <>
            <Form.Item label="Achievement title" name="title">
              <Input />
            </Form.Item>
            <Form.Item label="Link" name="link">
              <Input placeholder="https://..." />
            </Form.Item>
            <Form.Item label="Description" name="description">
              <Input.TextArea rows={5} />
            </Form.Item>
          </>
        )}

        <Divider />
        <Flex wrap gap={12} justify="space-between" align="center">
          {selection.type !== 'header' && onDeleteItem && (
            <Popconfirm
              title="Delete this item?"
              description="This permanently removes the entry from your resume."
              okText="Yes, delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
              icon={<DeleteOutlined />}
              onConfirm={handleDelete}
            >
              <Button danger icon={<DeleteOutlined />}>
                Delete item
              </Button>
            </Popconfirm>
          )}
          <Space>
            {selection.type !== 'header' && onMoveItem && (
              <Space.Compact size="small">
                <Button
                  icon={<ArrowUpOutlined />}
                  disabled={!canMoveUp}
                  onClick={() => { onMoveItem(selection, 'up'); onClose(); }}
                  aria-label="Move item up"
                />
                <Button
                  icon={<ArrowDownOutlined />}
                  disabled={!canMoveDown}
                  onClick={() => { onMoveItem(selection, 'down'); onClose(); }}
                  aria-label="Move item down"
                />
              </Space.Compact>
            )}
            <Button icon={<CloseOutlined />} onClick={onClose}>
              Cancel
            </Button>
            <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
              Save changes
            </Button>
          </Space>
        </Flex>
      </Form>
    </Modal>
  );
};

export type { EditorSelection };
export default ResumeEditorPopover;
