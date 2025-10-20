/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        felt: {
          light: '#0a5a3c',
          DEFAULT: '#064e3b',
          dark: '#022c22',
        },
      },
    },
  },
  plugins: [],
}


