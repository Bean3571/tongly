const colors = require('tailwindcss/colors')

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        primary: colors.blue,
        secondary: colors.gray,
        gray: {
          850: '#1b1f23',
          950: '#0d1117',
        },
        // Dark mode colors
        dark: {
          bg: '#1a1a1a',
          card: '#2d2d2d',
          text: '#ffffff',
          border: '#404040',
        },
      },
    },
  },
  plugins: [],
}