/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // Ensure this is set
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [
    require('tailwind-scrollbar')({ nocompatible: true }),
  ],
};
