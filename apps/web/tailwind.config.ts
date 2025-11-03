import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: '#FF5A8C',
          light: '#FFD6E5',
          gray: '#DDDDDD',
        },
      },
    },
  },
  plugins: [],
};

export default config;
