module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Include all JS/TS/JSX/TSX files in the src directory
  ],
  darkMode: 'class', // Enable dark mode using the 'class' strategy
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6', // Blue
        secondary: '#10B981', // Green
        accent: '#F59E0B', // Amber
        dark: '#1F2937', // Dark gray
        light: '#F9FAFB', // Light gray
      },
    },
  },
  plugins: [],
};