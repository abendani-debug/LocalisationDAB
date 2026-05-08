// tailwind.config.ts
// NOTE: This project uses Tailwind CSS v4 which uses CSS-based configuration.
// Theme customization is defined in app/globals.css via @theme directives.
// This file is kept for tooling compatibility only.
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary:   '#00C896',
        'primary-dark': '#00A87E',
        secondary: '#2563EB',
        'secondary-dark': '#1D4ED8',
        accent:    '#FF6B35',
        danger:    '#EF4444',
        warning:   '#FFB800',
        dark:      '#0F172A',
        surface:   '#F8FAFC',
        border:    '#E2E8F0',
      },
      fontFamily: {
        sans:     ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display:  ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #00C896 0%, #2563EB 100%)',
        'gradient-brand-r': 'linear-gradient(135deg, #2563EB 0%, #00C896 100%)',
      },
      boxShadow: {
        'primary': '0 8px 30px rgba(0, 200, 150, 0.25)',
        'secondary': '0 8px 30px rgba(37, 99, 235, 0.25)',
        'card': '0 2px 16px rgba(15, 23, 42, 0.06)',
        'card-hover': '0 8px 32px rgba(15, 23, 42, 0.12)',
      },
      animation: {
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
