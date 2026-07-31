/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'disabled',
  theme: {
    extend: {
      colors: {
        sovereign: {
          orange: '#E85D04',
          'orange-hover': '#DC2F02',
          'orange-active': '#9D0208',
          navy: '#1B263B',
          slate: '#415A77',
          mist: '#E0E1DD',
          cloud: '#F8F9FA',
          white: '#FFFFFF',
        },
      },
      fontFamily: {
        heading: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'sovereign-sm': '0 1px 2px 0 rgba(232, 93, 4, 0.05)',
        'sovereign-md': '0 4px 6px -1px rgba(232, 93, 4, 0.1), 0 2px 4px -2px rgba(232, 93, 4, 0.1)',
        'sovereign-lg': '0 10px 15px -3px rgba(232, 93, 4, 0.1), 0 4px 6px -4px rgba(232, 93, 4, 0.1)',
      },
    },
  },
  plugins: [],
};
