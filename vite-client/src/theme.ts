import { theme as antdThemeEngine, type ThemeConfig } from 'antd';

export type ThemeMode = 'light' | 'dark';

/**
 * Ant Design theme for the Resume Maker app.
 *
 * - `colorPrimary` mirrors the resume accent (#1e90ff) used across the
 *   template CSS so the UI and the document share a visual identity.
 * - `borderRadius` squared slightly for a modern, clean feel.
 * - `fontFamily` matches the document font (Inter) where possible.
 * - Dynamic algorithm for seamless light and dark mode switching.
 */
export const getAntdTheme = (mode: ThemeMode): ThemeConfig => ({
  algorithm: mode === 'dark' ? antdThemeEngine.darkAlgorithm : antdThemeEngine.defaultAlgorithm,
  token: {
    colorPrimary: '#1e90ff',
    colorInfo: '#1e90ff',
    colorLink: '#1e90ff',
    colorBgLayout: mode === 'dark' ? '#0f172a' : '#f8fafc',
    colorBgContainer: mode === 'dark' ? '#1e293b' : '#ffffff',
    colorBgElevated: mode === 'dark' ? '#1e293b' : '#ffffff',
    colorBorder: mode === 'dark' ? '#334155' : '#e2e8f0',
    colorBorderSecondary: mode === 'dark' ? '#1e293b' : '#f1f5f9',
    colorText: mode === 'dark' ? '#f8fafc' : 'rgba(0, 0, 0, 0.88)',
    colorTextSecondary: mode === 'dark' ? '#94a3b8' : '#475569',
    borderRadius: 6,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  components: {
    Button: {
      controlHeight: 34,
    },
    Modal: {
      borderRadiusLG: 12,
    },
    Card: {
      borderRadiusLG: 12,
    },
  },
});

export const antdTheme: ThemeConfig = getAntdTheme('light');