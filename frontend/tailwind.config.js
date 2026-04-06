/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-green': '#10a37f',
        'brand-green-hover': '#0e8f6e',
        'brand-green-light': '#e6f6f2',
        'sidebar-bg': '#111827',
        'sidebar-text': '#9ca3af',
        'sidebar-text-active': '#ffffff',
        'sidebar-item-hover': 'rgba(255,255,255, 0.05)',
        'sidebar-bg-active': 'rgba(255,255,255, 0.08)',
        'body-bg': '#f8fafc',
        'text-main': '#0f172a',
        'text-muted': '#64748b',
        'border-color': '#e2e8f0',
        'status-active-bg': '#ecfdf5',
        'status-active-text': '#059669',
        'status-warning-bg': '#fefce8',
        'status-warning-text': '#ca8a04',
        'status-danger-bg': '#fef2f2',
        'status-danger-text': '#dc2626',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
