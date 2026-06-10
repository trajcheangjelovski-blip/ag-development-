/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          50: '#f0f4ff',
          100: '#dbeafe',
          600: '#1a3360',
          700: '#162b52',
          800: '#0f1f3d',
          900: '#0a1628',
        },
      },
    },
  },
  plugins: [],
}
