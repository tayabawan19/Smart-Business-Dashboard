/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0e9fe',
          200: '#c7d7fe',
          300: '#a4bdfc',
          400: '#7a9bf8',
          500: '#5472f3',
          600: '#384ee8',
          700: '#2b3bcc',
          800: '#2632a5',
          900: '#232d82',
          950: '#151b4f',
        },
        dark: {
          bg: '#0B0F19',
          card: '#111827',
          sidebar: '#0D1322',
          border: '#1E293B',
          hover: '#1F293D',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 25px -5px rgba(84, 114, 243, 0.3)',
        'glow-lg': '0 0 35px -5px rgba(84, 114, 243, 0.45)',
      }
    },
  },
  plugins: [],
}
