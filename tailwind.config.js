/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        chef: {
          50: '#fef7ee',
          100: '#fdecd3',
          200: '#fad5a5',
          300: '#f6b76d',
          400: '#f19332',
          500: '#ee7712',
          600: '#df5c08',
          700: '#b94409',
          800: '#93360e',
          900: '#772e0f',
          950: '#401506',
        },
        sage: {
          50: '#f4f7f4',
          100: '#e3ebe3',
          200: '#c8d7c9',
          300: '#a0b9a2',
          400: '#739576',
          500: '#527856',
          600: '#3f5f43',
          700: '#344c37',
          800: '#2c3e2f',
          900: '#253328',
          950: '#121c14',
        },
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
        sans: ['system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
