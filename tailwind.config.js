/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pond: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        moss: {
          light: '#a7f3d0',
          DEFAULT: '#34d399',
          dark: '#065f46',
        },
        cream: {
          light: '#fefce8',
          DEFAULT: '#fef3c7',
          dark: '#fde68a',
        },
        water: {
          light: '#e0f2fe',
          DEFAULT: '#38bdf8',
          dark: '#0369a1',
          deep: '#0c4a6e',
        }
      },
      animation: {
        'squish': 'squish 0.25s ease-out',
        'float-up': 'floatUp 0.8s ease-out forwards',
        'egg-wobble': 'wobble 0.6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        squish: {
          '0%': { transform: 'scale(1, 1)' },
          '35%': { transform: 'scale(1.22, 0.78)' },
          '65%': { transform: 'scale(0.88, 1.12)' },
          '100%': { transform: 'scale(1, 1)' },
        },
        floatUp: {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-60px) scale(1.3)' },
        },
        wobble: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-8deg)' },
          '75%': { transform: 'rotate(8deg)' },
        },
        glowPulse: {
          '0%, 100%': { filter: 'drop-shadow(0 0 15px rgba(34, 197, 94, 0.5))' },
          '50%': { filter: 'drop-shadow(0 0 30px rgba(34, 197, 94, 0.9))' },
        }
      }
    },
  },
  plugins: [],
}
