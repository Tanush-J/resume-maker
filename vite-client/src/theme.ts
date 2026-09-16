import type { ThemeConfig } from 'antd';

/**
 * Ant Design theme for the Resume Maker app.
 *
 * - `colorPrimary` mirrors the resume accent (#1e90ff) used across the
 *   template CSS so the UI and the document share a visual identity.
 * - `borderRadius` squared slightly for a modern, clean feel.
 * - `fontFamily` matches the document font (Inter) where possible.
 */
export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1e90ff',
    colorInfo: '#1e90ff',
    colorLink: '#1e90ff',
    colorBgLayout: '#f5f7fa',
    colorText: 'rgba(0, 0, 0, 0.88)',
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
};