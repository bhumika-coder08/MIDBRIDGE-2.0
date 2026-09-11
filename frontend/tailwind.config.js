/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['GeistMono', 'monospace'],
        silkscreen: ['Silkscreen', 'cursive', 'sans-serif'],
      },
      colors: {
        crosslink: {
          dark: '#0a0a0c',
          card: '#121216',
          border: 'rgba(255, 255, 255, 0.1)',
          glow: 'rgba(255, 255, 255, 0.15)',
          silver: '#e2e8f0',
          accent: '#ffffff',
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        pulseGlow: 'pulseGlow 3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
