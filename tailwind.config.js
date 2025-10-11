/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Shared
        'brand-primary': '#6A3BFF', // Vibrant purple
        'brand-accent': '#F59E0B', // Amber/Orange for accents
        'brand-user-message': '#EA580C', // Orange-600 for user messages

        // Dark Theme
        'dark-bg': '#0D1117', // Almost black from GitHub
        'dark-card': '#161B22',
        'dark-border': '#30363D',
        
        // Light Theme - using default tailwind grays for a clean look
        'light-bg': '#F9FAFB', // gray-50
        'light-card': '#FFFFFF',
        'light-border': '#E5E7EB', // gray-200
      },
      backgroundImage: {
        'chat-bg-light': "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
        'chat-bg-dark': "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3e%3cg fill-rule='evenodd'%3e%3cg fill='%23ffffff' fill-opacity='0.03'%3e%3cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e\")",
      },
      keyframes: {
        'gradient-pan': {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' },
        },
      },
      animation: {
        'gradient-pan': 'gradient-pan 10s ease infinite',
      },
    },
  },
  plugins: [],
};
