/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#ffffff', // pure white app background
          900: '#ffffff', // panels
          850: '#ffffff', // cards
          800: '#f8fafc', // elevated / hover surface (slate-50)
          750: '#f1f5f9', // subtle hover (slate-100)
          700: '#e2e8f0', // subtle border (slate-200)
          650: '#cbd5e1', // visible border (slate-300)
          600: '#94a3b8', // active border
          500: '#64748b', // tertiary / muted text
          400: '#475569', // secondary text
          300: '#334155', // soft text
          200: '#1e293b', // high contrast text
          100: '#0f172a', // primary text
        },
        telemetry: {
          cyan: '#0284c7',
          emerald: '#059669',
          amber: '#d97706',
          rose: '#e11d48',
          violet: '#7c3aed',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
      },
      boxShadow: {
        'hud-card': '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.8)',
        'hud-glow': '0 0 20px -3px rgba(2, 132, 199, 0.35)',
        'hud-glow-emerald': '0 0 15px -3px rgba(5, 150, 105, 0.25)',
      },
    },
  },
  plugins: [],
}
