import React, { useState } from 'react';
import { Modal, Form, Input, Button, Typography, Tabs, message, Alert } from 'antd';
import {
  LockOutlined,
  MailOutlined,
  UserOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { useDispatch } from 'react-redux';
import { setUser } from '../../redux/authSlice';
import type { ResumeTemplateDefinition } from '../resumeBuilder/templates';

const { Title, Text, Paragraph } = Typography;

export type AuthIntent = 'create-resume' | null;

export interface AuthSuccessPayload {
  uid: string;
  intent?: AuthIntent;
  selectedTemplate?: ResumeTemplateDefinition | null;
}

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (payload: AuthSuccessPayload) => void;
  initialMode?: 'signin' | 'signup';
  intent?: AuthIntent;
  selectedTemplate?: ResumeTemplateDefinition | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  onClose,
  onSuccess,
  initialMode = 'signup',
  intent = null,
  selectedTemplate = null,
}) => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [signInForm] = Form.useForm();
  const [signUpForm] = Form.useForm();

  // Reset tab when modal opens with initialMode
  React.useEffect(() => {
    if (open) {
      setActiveTab(initialMode);
      setAuthError(null);
      signInForm.resetFields();
      signUpForm.resetFields();
    }
  }, [open, initialMode, signInForm, signUpForm]);

  const handleSignIn = async (values: { email: string; password: string }) => {
    try {
      setIsLoading(true);
      setAuthError(null);
      const res = await signInWithEmailAndPassword(auth, values.email, values.password);
      const uid = res.user.uid;
      
      message.success('Signed in successfully');
      onClose();
      if (onSuccess) {
        onSuccess({ uid, intent, selectedTemplate });
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (
        error.code === 'auth/invalid-login-credentials' ||
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password'
      ) {
        setAuthError('Invalid email or password.');
      } else {
        setAuthError(error.message || 'Error signing in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (values: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    dob?: { format: (fmt: string) => string } | null;
    gender?: string;
  }) => {
    try {
      setIsLoading(true);
      setAuthError(null);
      const res = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const uid = res.user.uid;

      // Save user profile in Firestore
      await setDoc(doc(db, 'users', uid), {
        name: `${values.firstName} ${values.lastName}`.trim(),
        email: values.email,
        dob: values.dob ? values.dob.format('YYYY-MM-DD') : '',
        gender: values.gender || '',
      });

      dispatch(setUser(res.user));
      message.success('Account created successfully');
      onClose();
      if (onSuccess) {
        onSuccess({ uid, intent, selectedTemplate });
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code === 'auth/email-already-in-use') {
        setAuthError('An account with this email already exists. Please sign in instead.');
      } else {
        setAuthError(error.message || 'Error creating account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={460}
      destroyOnClose
      centered
      aria-labelledby="auth-modal-title"
    >
      <div style={{ textAlign: 'center', marginBottom: 20, paddingTop: 8 }}>
        <Title id="auth-modal-title" level={3} style={{ margin: '0 0 8px' }}>
          {intent === 'create-resume' ? 'Create your resume' : 'Welcome to Resume Maker'}
        </Title>
        <Paragraph type="secondary" style={{ margin: 0, fontSize: 14 }}>
          Create a free account to save and manage your resumes and access them again later.
        </Paragraph>
        <div
          style={{
            marginTop: 12,
            padding: '8px 12px',
            background: 'var(--badge-bg, #f0f9ff)',
            border: '1px solid var(--badge-border, #e0f2fe)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textAlign: 'left',
          }}
        >
          <InfoCircleOutlined style={{ color: '#1e90ff' }} />
          <Text style={{ fontSize: 12, color: 'var(--badge-text, #0369a1)' }}>
            Your account is used to securely save and manage your resumes.
          </Text>
        </div>
      </div>

      {authError && (
        <Alert
          type="error"
          message={authError}
          showIcon
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setAuthError(null)}
        />
      )}

      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key as 'signin' | 'signup');
          setAuthError(null);
        }}
        centered
        items={[
          {
            key: 'signup',
            label: 'Sign Up',
            children: (
              <Form
                form={signUpForm}
                layout="vertical"
                onFinish={handleSignUp}
                requiredMark={false}
                autoComplete="off"
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Form.Item
                    name="firstName"
                    label="First Name"
                    rules={[{ required: true, message: 'Please enter your first name' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="Jane" />
                  </Form.Item>
                  <Form.Item
                    name="lastName"
                    label="Last Name"
                    rules={[{ required: true, message: 'Please enter your last name' }]}
                  >
                    <Input placeholder="Doe" />
                  </Form.Item>
                </div>

                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Please enter your email' },
                    { type: 'email', message: 'Please enter a valid email' },
                  ]}
                >
                  <Input prefix={<MailOutlined />} placeholder="jane.doe@example.com" />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { required: true, message: 'Please enter a password' },
                    { min: 6, message: 'Password must be at least 6 characters' },
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="At least 6 characters" />
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={isLoading}
                  style={{ marginTop: 8 }}
                >
                  Create Account & Continue
                </Button>

                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Already have an account?{' '}
                    <Button
                      type="link"
                      style={{ padding: 0 }}
                      onClick={() => {
                        setActiveTab('signin');
                        setAuthError(null);
                      }}
                    >
                      Sign In
                    </Button>
                  </Text>
                </div>
              </Form>
            ),
          },
          {
            key: 'signin',
            label: 'Sign In',
            children: (
              <Form
                form={signInForm}
                layout="vertical"
                onFinish={handleSignIn}
                requiredMark={false}
                autoComplete="off"
              >
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Please enter your email' },
                    { type: 'email', message: 'Please enter a valid email' },
                  ]}
                >
                  <Input prefix={<MailOutlined />} placeholder="you@example.com" />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Password"
                  rules={[{ required: true, message: 'Please enter your password' }]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="Your password" />
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={isLoading}
                  style={{ marginTop: 8 }}
                >
                  Sign In & Continue
                </Button>

                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Don't have an account?{' '}
                    <Button
                      type="link"
                      style={{ padding: 0 }}
                      onClick={() => {
                        setActiveTab('signup');
                        setAuthError(null);
                      }}
                    >
                      Sign Up
                    </Button>
                  </Text>
                </div>
              </Form>
            ),
          },
        ]}
      />
    </Modal>
  );
};
