/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#36aaf5',
          500: '#0c8fe1',
          600: '#0271c0',
          700: '#035a9c',
          800: '#074c80',
          900: '#0c406b',
        }
      }
    },
  },
  plugins: [],
}

