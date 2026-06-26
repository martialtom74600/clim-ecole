import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        radar: {
          void: '#FFFFFF',
          bg: '#FFFFFF',
          surface: '#FFFFFF',
          elevated: '#F4F4F5',
          canvas: '#FAFAFA',
          border: '#E4E4E7',
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
          hover: '#E4E4E7',
          border: '#E4E4E7',
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
        'display-lg': ['2.75rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        'display-md': ['2rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.04)',
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out forwards',
        ticker: 'ticker 60s linear infinite',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        ticker: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
      },
    },
  },
  plugins: [],
};

export default config;
