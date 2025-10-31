/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'secure': '#10b981',
        'non-secure': '#f59e0b',
        'error': '#ef4444',
        'idle': '#6b7280',
        'active': '#3b82f6',
      },
    },
  },
  plugins: [],
}
