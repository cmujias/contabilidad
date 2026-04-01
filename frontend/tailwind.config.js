/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Syne', 'sans-serif'],
      },
      colors: {
        slate: {
          950: '#0a0f1e',
          900: '#0f172a',
          850: '#131d35',
          800: '#1e293b',
        },
        accent: {
          DEFAULT: '#3b82f6',
          bright: '#60a5fa',
          glow: 'rgba(59,130,246,0.15)',
        },
        emerald: {
          glow: 'rgba(16,185,129,0.15)',
        },
        rose: {
          glow: 'rgba(244,63,94,0.15)',
        }
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(59,130,246,0.3)',
        'glow-emerald': '0 0 20px rgba(16,185,129,0.3)',
        'glow-rose': '0 0 20px rgba(244,63,94,0.3)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        'grid': '32px 32px',
      }
    },
  },
  plugins: [],
}
