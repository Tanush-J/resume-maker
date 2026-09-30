import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Col, Row, Typography, Space, Tag } from 'antd';
import {
  ArrowRightOutlined,
  DownloadOutlined,
  EditOutlined,
  FileTextOutlined,
  LayoutOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { listTemplates } from '../../components/resumeBuilder/templates';
import styles from './landingPage.module.css';

// Ensure adapters are registered for template lookups
import '../../components/resumeBuilder/classicAdapter';
import '../../components/resumeBuilder/professionalAdapter';

const { Title, Paragraph, Text } = Typography;

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const availableTemplates = listTemplates();

  useEffect(() => {
    document.title = 'Free Resume Builder | Create Professional Resumes';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Create a professional resume online with an easy-to-use resume builder and download it as a PDF.'
      );
    }
  }, []);

  // Landing page is navigation-only for "Create New Resume".
  const handleCreateClick = () => {
    navigate('/dashboard');
  };

  return (
    <div className={styles.landingContainer}>
      <main>
        {/* Hero Section */}
        <header className={styles.heroSection}>
          <div className={styles.badge}>
            <ThunderboltOutlined />
            <span>Fast, Free & Easy Online Resume Builder</span>
          </div>

          <Title className={styles.heroTitle} level={1}>
            Create a <span className={styles.heroGradientText}>Professional Resume</span> in Minutes
          </Title>

          <Paragraph className={styles.heroSubtitle}>
            Build a polished, job-winning resume using our easy-to-use resume builder and download
            it as a pixel-perfect PDF.
          </Paragraph>

          <div className={styles.ctaGroup}>
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              iconPosition="end"
              className={styles.heroCtaPrimary}
              onClick={handleCreateClick}
              aria-label="Create My Resume and get started"
            >
              Create My Resume
            </Button>
            <Button
              size="large"
              className={styles.heroCtaSecondary}
              onClick={() => navigate('/dashboard')}
              aria-label="Explore Templates"
            >
              Explore Templates
            </Button>
          </div>

          {/* Interactive Mockup / Visual Preview */}
          <div className={styles.previewWrapper}>
            <div className={styles.previewMockupHeader}>
              <div className={styles.dotRed} />
              <div className={styles.dotYellow} />
              <div className={styles.dotGreen} />
              <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                Live Resume Builder Preview
              </Text>
            </div>
            <div className={styles.previewGrid}>
              {availableTemplates.map((tpl) => (
                <Card
                  key={tpl.id}
                  hoverable
                  onClick={handleCreateClick}
                  className={styles.previewCard}
                >
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <div className={styles.previewThumb}>
                      <FileTextOutlined style={{ fontSize: 28, color: '#1e90ff' }} />
                      <Text style={{ fontSize: 13, fontWeight: 600 }}>{tpl.name}</Text>
                    </div>
                    <div>
                      <Tag color="blue">{tpl.name}</Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {tpl.preview?.label ?? 'ATS-friendly design'}
                      </Text>
                    </div>
                  </Space>
                </Card>
              ))}
            </div>
          </div>
        </header>

        {/* Features / Value Proposition Section */}
        <section className={styles.sectionBlock} aria-labelledby="features-heading">
          <div className={styles.sectionHeader}>
            <Title id="features-heading" level={2} className={styles.sectionTitle}>
              Build your resume easily
            </Title>
            <Paragraph className={styles.sectionDescription}>
              Choose a design, enter your information, customize it, and create a professional PDF.
            </Paragraph>
          </div>

          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} lg={6}>
              <Card className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <LayoutOutlined />
                </div>
                <Title level={4} style={{ marginBottom: 8 }}>
                  Modern Templates
                </Title>
                <Paragraph type="secondary" style={{ margin: 0 }}>
                  Crafted for readability, clean hierarchy, and strict ATS compatibility.
                </Paragraph>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <EditOutlined />
                </div>
                <Title level={4} style={{ marginBottom: 8 }}>
                  Visual Live Editing
                </Title>
                <Paragraph type="secondary" style={{ margin: 0 }}>
                  Intuitive inline editing with instant live document preview.
                </Paragraph>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <DownloadOutlined />
                </div>
                <Title level={4} style={{ marginBottom: 8 }}>
                  Pixel-Perfect PDF
                </Title>
                <Paragraph type="secondary" style={{ margin: 0 }}>
                  Accurate browser-to-server pagination with embedded fonts and zero cut-offs.
                </Paragraph>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <SafetyCertificateOutlined />
                </div>
                <Title level={4} style={{ marginBottom: 8 }}>
                  Private & Secure
                </Title>
                <Paragraph type="secondary" style={{ margin: 0 }}>
                  Your data is securely saved to your account and never shared publicly.
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </section>

        {/* How It Works Section */}
        <div className={styles.howItWorksBg}>
          <section className={styles.sectionBlock} aria-labelledby="how-it-works-heading">
            <div className={styles.sectionHeader}>
              <Title id="how-it-works-heading" level={2} className={styles.sectionTitle}>
                How it works
              </Title>
              <Paragraph className={styles.sectionDescription}>
                Three simple steps to your new job-ready resume.
              </Paragraph>
            </div>

            <Row gutter={[24, 24]}>
              <Col xs={24} md={8}>
                <div className={styles.stepCard}>
                  <div className={styles.stepNumber}>1</div>
                  <Title level={4} style={{ marginBottom: 8 }}>
                    Choose a Template
                  </Title>
                  <Paragraph type="secondary" style={{ flexGrow: 1 }}>
                    Pick from our clean, industry-standard resume layouts. Switch styles anytime
                    without losing your content.
                  </Paragraph>
                </div>
              </Col>

              <Col xs={24} md={8}>
                <div className={styles.stepCard}>
                  <div className={styles.stepNumber}>2</div>
                  <Title level={4} style={{ marginBottom: 8 }}>
                    Build Your Content
                  </Title>
                  <Paragraph type="secondary" style={{ flexGrow: 1 }}>
                    Add your work history, skills, education, projects, and contact info with
                    easy-to-use inline fields.
                  </Paragraph>
                </div>
              </Col>

              <Col xs={24} md={8}>
                <div className={styles.stepCard}>
                  <div className={styles.stepNumber}>3</div>
                  <Title level={4} style={{ marginBottom: 8 }}>
                    Download PDF
                  </Title>
                  <Paragraph type="secondary" style={{ flexGrow: 1 }}>
                    Export a high-resolution, perfectly paginated A4 PDF ready to send directly to
                    recruiters.
                  </Paragraph>
                </div>
              </Col>
            </Row>
          </section>
        </div>

        {/* Ready to Create CTA Section */}
        <section className={styles.finalCtaSection} aria-labelledby="cta-heading">
          <Title id="cta-heading" level={2} className={styles.finalCtaTitle}>
            Ready to create your resume?
          </Title>
          <Paragraph className={styles.finalCtaSubtitle}>
            Start building your standout resume right now. No credit card required.
          </Paragraph>
          <Button
            size="large"
            className={styles.finalCtaBtn}
            onClick={handleCreateClick}
            aria-label="Get Started with Resume Maker"
          >
            Get Started
          </Button>
        </section>
      </main>

      {/* Semantic Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div>
            <Text strong style={{ color: 'var(--text-primary)', fontSize: 16 }}>
              Resume Maker
            </Text>
            <Paragraph style={{ color: 'var(--footer-text)', margin: '4px 0 0', fontSize: 13 }}>
              Create professional, job-winning resumes in minutes.
            </Paragraph>
          </div>
          <nav className={styles.footerLinks} aria-label="Footer navigation">
            <button type="button" onClick={() => navigate('/dashboard')}>
              Dashboard
            </button>
            <button type="button" onClick={() => navigate('/dashboard')}>
              Sign In
            </button>
            <button type="button" onClick={() => navigate('/dashboard')}>
              Sign Up
            </button>
          </nav>
        </div>
      </footer>

      {/* Intentionally no auth modal for "Create New Resume".
          Dashboard owns the authentication flow. */}
    </div>
  );
};

export default LandingPage;
