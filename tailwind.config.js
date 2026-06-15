/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./latihan.html",
    "./js/**/*.js"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        arabic: ['"Noto Sans Arabic"', 'serif'],
      },
      colors: {
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          900: '#115e59',
        }
      }
    }
  },
  plugins: [],
  // Safelist memastikan class yang dibuat dinamis via JS tetap masuk ke bundle CSS
  safelist: [
    'md:pl-0',
    'md:pl-64',
    'opacity-0',
    'invisible',
    '-translate-y-4',
    'pointer-events-none',
    'focus-active',
    { pattern: /(bg|text|border)-(rose|amber|yellow|sky|indigo|emerald)-(50|400|600|700|950)/ },
    { pattern: /dark:(bg|text|border)-(rose|amber|yellow|sky|indigo|emerald)-(400|750|800|950)/ }
  ]
}