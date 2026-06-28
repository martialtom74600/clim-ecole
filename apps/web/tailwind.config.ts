import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Semantic surface / ink scale (the unified system) ───────────
        surface: {
          DEFAULT: '#FFFFFF',
          sunken: '#FAFAFA',
          raised: '#FFFFFF',
          muted: '#F4F4F5',
        },
        ink: {
          DEFAULT: '#18181B',
          soft: '#3F3F46',
          muted: '#71717A',
          subtle: '#A1A1AA',
          faint: '#D4D4D8',
        },
        line: {
          DEFAULT: '#E8E8EB',
          strong: '#D4D4D8',
        },
        // ── Semantic intents ────────────────────────────────────────────
        positive: {
          DEFAULT: '#16A34A',
          soft: '#ECFDF5',
          border: '#A7F3D0',
          text: '#047857',
        },
        warning: {
          DEFAULT: '#D97706',
          soft: '#FFFBEB',
          border: '#FDE68A',
          text: '#B45309',
        },
        info: {
          DEFAULT: '#2563EB',
          soft: '#EFF6FF',
          border: '#BFDBFE',
          text: '#1D4ED8',
        },
        heat: {
          DEFAULT: '#DC2626',
          soft: '#FEF2F2',
          border: '#FECACA',
          text: '#B91C1C',
        },
        // ── Legacy namespaces (kept for backward compat, now aligned) ─────
        radar: {
          void: '#FFFFFF',
          bg: '#FFFFFF',
          surface: '#FFFFFF',
          elevated: '#F4F4F5',
          canvas: '#FAFAFA',
          border: '#E8E8EB',
          'border-strong': '#D4D4D8',
          text: '#18181B',
          muted: '#71717A',
          subtle: '#A1A1AA',
          heat: '#DC2626',
          'heat-light': '#FEF2F2',
          signal: '#18181B',
          'signal-dim': '#27272A',
          success: '#16A34A',
          danger: '#DC2626',
          link: '#2563EB',
        },
        zen: {
          bg: '#FFFFFF',
          'bg-elevated': '#F4F4F5',
          panel: '#FFFFFF',
          elevated: '#F4F4F5',
          hover: '#F4F4F5',
          border: '#E8E8EB',
          teal: '#18181B',
          'teal-dim': '#27272A',
          text: '#18181B',
          muted: '#71717A',
          subtle: '#A1A1AA',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-2xl': ['4rem', { lineHeight: '1.02', letterSpacing: '-0.035em' }],
        'display-xl': ['3.25rem', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-lg': ['2.75rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        'display-md': ['2rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        // Money-shot figures for the War Room
        'figure-xl': ['3.5rem', { lineHeight: '1', letterSpacing: '-0.03em' }],
        'figure-lg': ['2.5rem', { lineHeight: '1', letterSpacing: '-0.025em' }],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(24,24,27,0.05)',
        card: '0 1px 2px rgba(24,24,27,0.04), 0 1px 3px rgba(24,24,27,0.04)',
        raised:
          '0 1px 2px rgba(24,24,27,0.04), 0 4px 12px -2px rgba(24,24,27,0.06)',
        overlay:
          '0 4px 16px -4px rgba(24,24,27,0.10), 0 16px 40px -8px rgba(24,24,27,0.12)',
        pop: '0 12px 40px -6px rgba(24,24,27,0.18)',
        focus: '0 0 0 3px rgba(24,24,27,0.12)',
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        shimmer: 'shimmer 1.6s linear infinite',
        ticker: 'ticker 60s linear infinite',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        ticker: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
