/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0E6B68',
          dark: '#084C4A',
          soft: '#DDF1EE',
        },
        accent: {
          DEFAULT: '#2BB3C0',
          soft: '#E1F7FA',
        },
        neutral: {
          950: '#17201F',
          700: '#3D4A47',
          500: '#6B7774',
          300: '#B9C8C4',
          200: '#D9E3E0',
          100: '#EEF5F3',
          50: '#F7FAF9',
        },
        success: {
          DEFAULT: '#2F8A5F',
          soft: '#E3F5EC',
        },
        warning: {
          DEFAULT: '#C98A13',
          soft: '#FFF3D8',
        },
        danger: {
          DEFAULT: '#C94A4A',
          soft: '#FBE4E4',
        },
        info: {
          DEFAULT: '#3578A8',
          soft: '#E5F1FA',
        },
      },
    },
  },
  plugins: [],
}
