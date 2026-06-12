/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* ── Brand (mockup-aligned) ── */
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#EFF6FF',
        },
        navy: {
          DEFAULT: '#001A4D',
          soft: '#2A3F75',
        },
        'brand-title': '#205BB9',
        hospital: {
          DEFAULT: '#205BB9',
          light: '#3B82E8',
          dark: '#1A4FA0',
        },
        /* ── Surfaces ── */
        surface: {
          page: '#F8F9FA',
          white: '#FFFFFF',
        },
        /* ── Typography ── */
        content: {
          heading: '#001A4D',
          body: '#374151',
          muted: '#6C757D',
        },
        gray: {
          200: '#E5E7EB',
          800: '#1F2937',
        },
        /* ── Borders ── */
        line: {
          DEFAULT: '#E0E0E0',
        },
        /* ── Sidebar ── */
        sidebar: {
          bg: '#E8F0FE',
          active: '#EFF6FF',
          'active-border': '#2563EB',
        },
        /* ── Semantic status (badges) ── */
        success: {
          DEFAULT: '#DEFBE8',
          fg: '#10B981',
          dark: '#047857',
        },
        warning: {
          DEFAULT: '#FFFBEB',
          fg: '#F59E0B',
          dark: '#B45309',
          border: '#FEF3C7',
          text: '#92400E',
          badge: '#FDE68A',
        },
        danger: {
          DEFAULT: '#FEF2F2',
          fg: '#EF4444',
          dark: '#DC2626',
        },
        info: {
          DEFAULT: '#EFF6FF',
          fg: '#3B82F6',
        },
        neutral: {
          DEFAULT: '#F3F4F6',
          fg: '#6B7280',
        },
        /* ── KPI icon backgrounds (mockup chấm công) ── */
        kpi: {
          present: '#DEFBE8',
          duty: '#FDF2C9',
          absent: '#FCE2E2',
        },
        /* ── Attendance table (mockup 2) ── */
        table: {
          header: '#F0F4FE',
        },
        pagination: {
          active: '#1D4ED8',
        },
        attendance: {
          search: '#E6EEFE',
          report: '#204FC2',
          'report-hover': '#1A42A8',
        },
        /* ── Dark mode (optional) ── */
        dark: {
          sidebar: '#1C2640',
          page: '#242D4C',
          border: '#303F66',
          text: '#F0F0F0',
        },
      },
      fontFamily: {
        sans: ['Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
      },
      /* Toàn hệ thống +0.20rem so với scale Tailwind mặc định */
      fontSize: {
        '4xs': ['0.7625rem', { lineHeight: '1rem' }],       /* ~9px  → +0.20rem */
        '2xs': ['0.825rem', { lineHeight: '1.1rem' }],       /* ~10px → +0.20rem */
        '3xs': ['0.8875rem', { lineHeight: '1.15rem' }],     /* ~11px → +0.20rem */
        xs: ['0.95rem', { lineHeight: '1.2rem' }],           /* 0.75rem + 0.20 */
        sm: ['1.075rem', { lineHeight: '1.45rem' }],         /* 0.875rem + 0.20 */
        base: ['1.2rem', { lineHeight: '1.7rem' }],          /* 1rem + 0.20 */
        lg: ['1.325rem', { lineHeight: '1.95rem' }],         /* 1.125rem + 0.20 */
        xl: ['1.45rem', { lineHeight: '1.95rem' }],          /* 1.25rem + 0.20 */
        '2xl': ['1.7rem', { lineHeight: '2.2rem' }],         /* 1.5rem + 0.20 */
        '3xl': ['2.075rem', { lineHeight: '2.45rem' }],      /* 1.875rem + 0.20 */
        '4xl': ['2.45rem', { lineHeight: '2.7rem' }],        /* 2.25rem + 0.20 */
        '5xl': ['3.2rem', { lineHeight: '1' }],
        '6xl': ['3.95rem', { lineHeight: '1' }],
        '7xl': ['4.7rem', { lineHeight: '1' }],
        '8xl': ['6.2rem', { lineHeight: '1' }],
        '9xl': ['8.2rem', { lineHeight: '1' }],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        panel: '0 4px 12px rgba(37, 99, 235, 0.08)',
      },
      borderRadius: {
        xl: '12px',
      },
    },
  },
  plugins: [],
};
