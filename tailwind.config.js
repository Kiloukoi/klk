/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00C48C', // Base green from logo
          dark: '#00B37F',    // Darker shade
          light: '#00E69D',   // Lighter shade
        },
        secondary: {
          DEFAULT: '#00E676', // Complementary green
          dark: '#00C853',
          light: '#69F0AE',
        },
        accent: {
          DEFAULT: '#FF4081', // Pink accent for important actions
          dark: '#F50057',
          light: '#FF80AB',
        },
        neutral: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 196, 140, 0.2)',
      },
      backdropBlur: {
        'glass': '8px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'loadingBar': 'loadingBar 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};