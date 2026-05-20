/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          light: '#ff8787', // Light Coral
          DEFAULT: '#ff6b6b', // Vibrant Coral
          dark: '#fa5252', // Deep Coral
        },
        secondary: {
          light: '#334155', // Slate 700
          DEFAULT: '#1e293b', // Deep Slate Blue
          dark: '#0f172a', // Slate 900
        }
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out forwards',
      }
    },
  },
  plugins: [],
}
