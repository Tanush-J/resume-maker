import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../../firebase';
import {
  createResume,
  deleteResume,
  listResumes,
  renameResume,
} from '../../components/resumeBuilder/resumeRepository';
import {
  getTemplateAdapterSafe,
  listTemplates,
  type ResumeTemplateDefinition,
} from '../../components/resumeBuilder/templates';
import type { ResumeDocument } from '../../components/resumeBuilder/resumeModel';
import {
  AuthModal,
  type AuthIntent,
  type AuthSuccessPayload,
} from '../../components/auth/authModal';
import {
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Modal,
  Popconfirm,
  Row,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  FileAddOutlined,
  FileTextOutlined,
  PlusOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

// Side-effect imports — ensure adapters are registered for template lookups
import '../../components/resumeBuilder/classicAdapter';
import '../../components/resumeBuilder/professionalAdapter';

const { Title, Paragraph, Text } = Typography;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [resumes, setResumes] = useState<ResumeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signup');
  const [authIntent, setAuthIntent] = useState<AuthIntent>(null);
  const [pendingTemplate, setPendingTemplate] = useState<ResumeTemplateDefinition | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const availableTemplates = listTemplates();

  const loadUserResumes = async (uid: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const list = await listResumes(uid);
      // Sort most recently updated first
      list.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
      setResumes(list);
    } catch (err) {
      console.error('Failed to list resumes:', err);
      setError('Unable to load your resumes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Dashboard | Resume Maker';

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setResumes([]);
        setIsLoading(false);
        return;
      }
      void loadUserResumes(user.uid);
    });

    return unsubscribe;
  }, []);

  const handleCreateResume = async (template: ResumeTemplateDefinition) => {
    const uid = currentUser?.uid || auth.currentUser?.uid;
    if (!uid) {
      setPendingTemplate(template);
      setAuthIntent('create-resume');
      setAuthModalMode('signup');
      setIsAuthModalOpen(true);
      return;
    }

    try {
      setIsCreating(true);
      const newResume = await createResume(uid, template.id, template.version);
      setIsTemplateModalOpen(false);
      setPendingTemplate(null);
      void message.success(`Created "${newResume.name}"`);
      navigate(`/resumes/${encodeURIComponent(newResume.id)}/edit`);
    } catch (err) {
      console.error('Failed to create resume:', err);
      void message.error('Failed to create new resume.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateClick = () => {
    if (!currentUser) {
      setPendingTemplate(null);
      setAuthIntent('create-resume');
      setAuthModalMode('signup');
      setIsAuthModalOpen(true);
    } else {
      setIsTemplateModalOpen(true);
    }
  };

  const handleAuthSuccess = async (payload: AuthSuccessPayload) => {
    if (payload.intent === 'create-resume') {
      const targetTemplate = payload.selectedTemplate ?? pendingTemplate;
      if (targetTemplate) {
        await handleCreateResume(targetTemplate);
      } else {
        setIsTemplateModalOpen(true);
      }
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    const user = currentUser || auth.currentUser;
    if (!user) return;

    try {
      await deleteResume(user.uid, resumeId);
      setResumes((current) => current.filter((r) => r.id !== resumeId));
      void message.success('Resume deleted');
    } catch (err) {
      console.error('Failed to delete resume:', err);
      void message.error('Unable to delete resume.');
    }
  };

  const openRenameModal = (resume: ResumeDocument) => {
    setRenameTargetId(resume.id);
    setRenameValue(resume.name ?? '');
    setRenameError(null);
    setIsRenameModalOpen(true);
  };

  const closeRenameModal = () => {
    setIsRenameModalOpen(false);
    setRenameTargetId(null);
    setRenameError(null);
  };

  const handleSaveRename = async () => {
    const user = currentUser || auth.currentUser;
    if (!user || !renameTargetId) return;

    const normalized = renameValue.trim();
    const maxLength = 30;
    if (!normalized) {
      setRenameError('Resume name cannot be empty.');
      return;
    }
    if (normalized.length > maxLength) {
      setRenameError(`Resume name must be at most ${maxLength} characters.`);
      return;
    }

    try {
      setRenameError(null);
      await renameResume(user.uid, renameTargetId, normalized);
      setResumes((current) => current.map((r) => (r.id === renameTargetId ? { ...r, name: normalized } : r)));
      void message.success('Resume renamed');
      closeRenameModal();
    } catch (err) {
      console.error('Failed to rename resume:', err);
      setRenameError('Unable to rename resume. Please try again.');
      void message.error('Unable to rename resume.');
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'recently';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  // -----------------------------------------------------------------
  // Public Logged-Out Dashboard State
  // -----------------------------------------------------------------
  if (!currentUser && !isLoading) {
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap" gap={12}>
          <div>
            <Title level={2} style={{ margin: 0 }}>Your Resume Dashboard</Title>
            <Text type="secondary">Create and manage professional resumes.</Text>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={handleCreateClick}
            aria-label="Create New Resume"
          >
            Create New Resume
          </Button>
        </Flex>

        {/* Start Building Callout Card */}
        <Card
          style={{
            marginBottom: 32,
            background: 'var(--badge-bg)',
            border: '1px solid var(--badge-border)',
          }}
        >
          <Row gutter={[24, 16]} align="middle">
            <Col xs={24} md={16}>
              <Title level={3} style={{ margin: '0 0 8px', color: 'var(--badge-text)' }}>
                Start building your resume
              </Title>
              <Paragraph style={{ margin: '0 0 12px', fontSize: 15 }}>
                Choose a resume layout and create a professional resume in a few steps.
              </Paragraph>
              <div>
                <Text type="secondary">
                  Already have an account?{' '}
                  <Button
                    type="link"
                    style={{ padding: 0, fontWeight: 600 }}
                    onClick={() => {
                      setAuthIntent('create-resume');
                      setAuthModalMode('signin');
                      setIsAuthModalOpen(true);
                    }}
                  >
                    Sign in
                  </Button>
                </Text>
              </div>
            </Col>
            <Col xs={24} md={8} style={{ textAlign: 'right' }}>
              <Button
                type="primary"
                size="large"
                icon={<ThunderboltOutlined />}
                onClick={handleCreateClick}
                style={{ height: 44, padding: '0 24px', fontWeight: 600 }}
              >
                Create New Resume
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Templates Showcase */}
        <div>
          <Title level={3} style={{ marginBottom: 8 }}>Explore Templates</Title>
          <Paragraph type="secondary" style={{ marginBottom: 20 }}>
            Select any template to begin creating your resume. Switch anytime in the editor.
          </Paragraph>

          <Row gutter={[20, 20]}>
            {availableTemplates.map((template) => (
              <Col key={template.id} xs={24} sm={12} md={8}>
                <Card
                  hoverable
                  style={{ textAlign: 'center', height: '100%' }}
                  onClick={() => {
                    setPendingTemplate(template);
                    setAuthIntent('create-resume');
                    setAuthModalMode('signup');
                    setIsAuthModalOpen(true);
                  }}
                >
                  <div
                    style={{
                      height: 140,
                      background: 'var(--preview-thumb-bg)',
                      borderRadius: 6,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                      border: '1px dashed var(--border-color)',
                    }}
                  >
                    <FileTextOutlined style={{ fontSize: 36, marginBottom: 8, color: '#1e90ff' }} />
                    <Text strong style={{ fontSize: 14 }}>
                      {template.name}
                    </Text>
                  </div>

                  <Title level={4} style={{ margin: '0 0 6px' }}>{template.name}</Title>
                  <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 12 }}>
                    {template.preview?.label ?? 'Professional, ATS-friendly format.'}
                  </Paragraph>
                  <Button type="primary" size="middle">Select Template</Button>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* Auth Modal with Intent Preservation */}
        <AuthModal
          open={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
          initialMode={authModalMode}
          intent={authIntent}
          selectedTemplate={pendingTemplate}
        />
      </div>
    );
  }

  // -----------------------------------------------------------------
  // Authenticated Dashboard State
  // -----------------------------------------------------------------
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap" gap={12}>
        <div>
          <Title level={2} style={{ margin: 0 }}>My Resumes</Title>
          <Text type="secondary">Manage your resumes, choose templates, and export PDFs</Text>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => setIsTemplateModalOpen(true)}
          aria-label="Create Resume"
        >
          Create Resume
        </Button>
      </Flex>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <Spin size="large" />
        </div>
      ) : error ? (
        <Empty description={error}>
          <Button onClick={() => currentUser && loadUserResumes(currentUser.uid)}>
            Retry
          </Button>
        </Empty>
      ) : resumes.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3rem 0' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="You don't have any resumes yet."
          >
            <Button
              type="primary"
              icon={<FileAddOutlined />}
              onClick={() => setIsTemplateModalOpen(true)}
            >
              Create Your First Resume
            </Button>
          </Empty>
        </Card>
      ) : (
        <Row gutter={[20, 20]}>
          {resumes.map((item) => {
            const templateAdapter = getTemplateAdapterSafe(item.templateId);
            const templateName = templateAdapter?.definition.name ?? item.templateId;

            return (
              <Col key={item.id} xs={24} sm={12} md={8}>
                <Card
                  hoverable
                  actions={[
                    <Button
                      key="edit"
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => navigate(`/resumes/${encodeURIComponent(item.id)}/edit`)}
                    >
                      Open
                    </Button>,
                    <Popconfirm
                      key="delete"
                      title="Delete this resume?"
                      description="This action cannot be undone."
                      okText="Delete"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => handleDeleteResume(item.id)}
                    >
                      <Button type="link" danger icon={<DeleteOutlined />}>
                        Delete
                      </Button>
                    </Popconfirm>,
                    <Button
                      key="rename"
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => openRenameModal(item)}
                    >
                      Rename
                    </Button>,
                  ]}
                >
                  {/* Template placeholder preview */}
                  <div
                    style={{
                      height: 140,
                      background: 'var(--preview-thumb-bg)',
                      borderRadius: 4,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                      border: '1px dashed var(--border-color)',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate(`/resumes/${encodeURIComponent(item.id)}/edit`)}
                  >
                    <FileTextOutlined style={{ fontSize: 32, marginBottom: 8, color: '#1e90ff' }} />
                    <span style={{ fontSize: 12, fontWeight: 500 }}>
                      {templateName}
                    </span>
                  </div>

                  <Title
                    level={5}
                    style={{ margin: '0 0 6px', cursor: 'pointer' }}
                    onClick={() => navigate(`/resumes/${encodeURIComponent(item.id)}/edit`)}
                  >
                    {item.name || 'Untitled Resume'}
                  </Title>

                  <Flex justify="space-between" align="center">
                    <Tag color="blue">{templateName}</Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Updated {formatDate(item.updatedAt)}
                    </Text>
                  </Flex>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Create Resume — Template Selection Modal */}
      <Modal
        open={isTemplateModalOpen}
        title="Choose a Template for Your New Resume"
        onCancel={() => setIsTemplateModalOpen(false)}
        footer={null}
        width={640}
        destroyOnClose
      >
        <Paragraph type="secondary">
          Select a starting template. You can switch templates anytime in the editor without losing your content.
        </Paragraph>
        <Row gutter={[16, 16]}>
          {availableTemplates.map((template) => (
            <Col key={template.id} xs={24} sm={12}>
              <Card
                hoverable
                style={{ textAlign: 'center' }}
                onClick={() => handleCreateResume(template)}
                loading={isCreating}
              >
                <div
                  style={{
                    height: 130,
                    background: 'var(--preview-thumb-bg)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 4,
                    marginBottom: 12,
                    border: '1px dashed var(--border-color)',
                  }}
                >
                  <FileTextOutlined style={{ fontSize: 32, marginBottom: 6, color: '#1e90ff' }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {template.preview?.label ?? template.name}
                  </Text>
                </div>
                <Title level={5} style={{ margin: '0 0 4px' }}>
                  {template.name}
                </Title>
                <Button type="primary" size="small" style={{ marginTop: 8 }}>
                  Select Template
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </Modal>


      {/* Rename Resume Modal */}
      <Modal
        open={isRenameModalOpen}
        title="Rename Resume"
        onCancel={closeRenameModal}
        onOk={handleSaveRename}
        okText="Save"
        cancelText="Cancel"
        destroyOnClose
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Typography.Text type="secondary">Resume name</Typography.Text>
          <input
            value={renameValue}
            onChange={(e) => {
              setRenameValue(e.target.value);
              if (renameError) setRenameError(null);
            }}
            maxLength={30}
            style={{
              width: '100%',
              padding: '8px 10px',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
            }}
          />
          {renameError && (
            <Typography.Text type="danger" style={{ fontSize: 12 }}>
              {renameError}
            </Typography.Text>
          )}
        </div>
      </Modal>
      {/* Auth Modal (if needed while on dashboard) */}
      <AuthModal
        open={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authModalMode}
        intent={authIntent}
        selectedTemplate={pendingTemplate}
      />
    </div>
  );
};

export default Dashboard;
