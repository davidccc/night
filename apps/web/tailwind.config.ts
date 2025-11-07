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
          pink: '#C04A7A',
          light: '#F6D5DF',
          gray: '#D8B7C0',
        },
      },
    },
  },
  plugins: [],
};

export default config;
