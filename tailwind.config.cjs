/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './{App,index}.tsx', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { app: { bg: '#F6F2FA', card: '#E8E0EF', gold: '#483383', goldDark: '#352C48', text: '#100F19', textSec: '#6E585B' } },
      fontFamily: {
        sans: ['Alexandria', 'sans-serif'], alexandria: ['Alexandria', 'sans-serif'],
        amiri: ['Amiri', 'serif'], arefRuqaa: ['Aref Ruqaa', 'serif'], lateef: ['Lateef', 'serif'],
        cairo: ['Cairo', 'sans-serif'], readexPro: ['Readex Pro', 'sans-serif'], active: ['Readex Pro', 'sans-serif'],
      },
      keyframes: {
        'caret-blink': { '0%,70%,100%': { opacity: '1' }, '20%,50%': { opacity: '0' } },
      },
      animation: { 'caret-blink': 'caret-blink 1.25s ease-out infinite' },
    },
  },
  plugins: [],
};
