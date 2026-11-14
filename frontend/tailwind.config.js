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
          950: '#070a0f', // deep void
          900: '#0b0f17', // main dark background
          850: '#101725', // card / panel background
          800: '#162032', // elevated surface
          750: '#1e2c45', // hover surface
          700: '#273856', // subtle border
          600: '#3c527a', // visible border
          500: '#5c79a8', // tertiary / muted text
          400: '#8ba6d1', // secondary text
          300: '#b8cde8', // soft text
          200: '#dce8f7', // high contrast text
          100: '#f1f6fd', // primary text
        },
        telemetry: {
          cyan: '#38bdf8',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
          violet: '#a855f7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
      },
      boxShadow: {
        'hud-card': '0 4px 20px -2px rgba(7, 10, 15, 0.7), 0 0 0 1px rgba(60, 82, 122, 0.3)',
        'hud-glow': '0 0 15px -3px rgba(56, 189, 248, 0.25)',
        'hud-glow-emerald': '0 0 15px -3px rgba(16, 185, 129, 0.25)',
      },
    },
  },
  plugins: [],
}
