/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        stainless: {
          50: '#FAFBFC',
          100: '#F5F7F8',
          200: '#E8EBED',
        },
        chef: {
          DEFAULT: '#111315',
          muted: '#3A3F44',
          subtle: '#5A646C',
        },
        steel: {
          DEFAULT: '#D7DCE0',
          light: '#E8EBED',
          dark: '#B8BFC6',
        },
        copper: {
          50: '#F5EDE4',
          100: '#EDD9C8',
          400: '#C4864F',
          500: '#B87333',
          600: '#8F5A28',
          700: '#6B4420',
        },
        sage: {
          50: '#EEF2ED',
          100: '#DDE5DA',
          200: '#C5D0C0',
          400: '#8A9A84',
          500: '#66785F',
          600: '#4A5A44',
          700: '#3A4736',
        },
        burgundy: {
          50: '#F3EAEC',
          500: '#5E1F2D',
          600: '#451722',
          700: '#351019',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(17, 19, 21, 0.06)',
        elevated: '0 4px 20px rgba(17, 19, 21, 0.1)',
        glow: '0 0 48px rgba(184, 115, 51, 0.18)',
      },
      backgroundImage: {
        'marketing-radial': 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(184, 115, 51, 0.12), transparent)',
      },
      maxWidth: {
        content: '680px',
        dashboard: '960px',
      },
    },
  },
  plugins: [],
};
