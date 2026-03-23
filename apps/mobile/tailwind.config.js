/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    '../../packages/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        canvas: '#f9f1e7',
        'canvas-alt': '#ead8c6',
        surface: '#fffbf6',
        input: '#f7efe6',
        ink: '#1f1a17',
        muted: '#6f6257',
        brand: '#b85c38',
        'brand-strong': '#8f3d20',
        'brand-soft': '#f1d6c5',
        sage: '#2f5d50',
        line: {
          soft: 'rgba(72, 56, 45, 0.16)',
          brand: 'rgba(184, 92, 56, 0.14)',
        },
      },
      boxShadow: {
        card: '0 14px 26px rgba(90, 62, 36, 0.18)',
        cta: '0 10px 18px rgba(143, 61, 32, 0.3)',
      },
    },
  },
  plugins: [],
};
