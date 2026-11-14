/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7f0',
          100: '#d4e8d4',
          200: '#a8d1a8',
          300: '#7cba7c',
          400: '#4a9e4a',
          500: '#2d7a2d',
          600: '#1a5c1a',
          700: '#1a4d1a',
          800: '#153d15',
          900: '#0f2d0f',
        },
        forest: {
          DEFAULT: '#1a3a1a',
          light: '#2d5a2d',
        },
        cream: {
          DEFAULT: '#faf8f4',
          dark: '#f0ede6',
        },
        olive: {
          DEFAULT: '#4a6741',
          light: '#e8f0e4',
        },
        earth: {
          DEFAULT: '#8B7355',
          light: '#d4c5a9',
        },
        status: {
          low: '#22c55e',
          moderate: '#f59e0b',
          high: '#ef4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Myanmar', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
