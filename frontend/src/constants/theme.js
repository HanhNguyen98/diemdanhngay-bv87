/**
 * BV87 Design Tokens — single source of truth for UI colors.
 * Synced with tailwind.config.js and mockup (Light Mode).
 *
 * Usage in JSX: prefer Tailwind classes (bg-primary, text-navy, badge-success).
 * Do NOT use raw hex in components — extend this file + tailwind.config instead.
 */

/** App UI font — synced with tailwind.config.js `fontFamily.sans` (SPEC: Montserrat) */
export const FONT_FAMILY_SANS = "'Montserrat', system-ui, 'Segoe UI', sans-serif";

export const COLORS = {
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  navy: '#001A4D',
  navySoft: '#2A3F75',

  surfacePage: '#F8F9FA',
  surfaceWhite: '#FFFFFF',
  border: '#E0E0E0',

  textHeading: '#001A4D',
  textMuted: '#6C757D',

  sidebarActive: '#EFF6FF',

  success: { bg: '#DEFBE8', fg: '#10B981', dark: '#047857' },
  warning: {
    bg: '#FFFBEB',
    fg: '#F59E0B',
    dark: '#B45309',
    border: '#FEF3C7',
    text: '#92400E',
    badge: '#FDE68A',
  },
  danger: { bg: '#FEF2F2', fg: '#EF4444', dark: '#DC2626' },
  info: { bg: '#EFF6FF', fg: '#3B82F6', surface: '#E7F1FF', line: '#B6D4FE' },
  neutral: { bg: '#F3F4F6', fg: '#6B7280' },
  deptActive: '#1C8538',

  kpiPresent: '#DEFBE8',
  kpiDuty: '#FDF2C9',
  kpiAbsent: '#FCE2E2',
  /** Summary “Tổng…” metric cards (P3e) — synced with info.surface / info.line */
  kpiTotal: { bg: '#E7F1FF', border: '#B6D4FE' },
};
