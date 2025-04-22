/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'admin-primary': '#6366f1',
        'admin-secondary': '#4f46e5',
        'admin-dark': '#0A0A0F'
      }
    },
  },
  plugins: [],
};