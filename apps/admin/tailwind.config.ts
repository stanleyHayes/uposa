import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Euclid Circular A', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Euclid Circular A', 'ui-serif', 'Georgia', 'serif'],
        status: ['Outfit', 'Euclid Circular A', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#e6edf8',
          100: '#ccdaf0',
          200: '#99b5e1',
          300: '#6690d2',
          400: '#336bc3',
          500: '#001B50',
          600: '#001848',
          700: '#001540',
          800: '#001238',
          900: '#000f30',
          950: '#000a20',
        },
        cream: {
          50: '#FFFDF5',
          100: '#FFF8DC',
          200: '#F5EDCF',
          300: '#EBE3C3',
          400: '#E0D8B6',
          500: '#D5CDA9',
        },
        dark: {
          bg: '#0a1a3a',
          card: '#0d1f42',
          hover: '#112550',
          border: '#1a3060',
          surface: '#0b1c3e',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
