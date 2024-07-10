import type {Config} from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FFFFFF',
        secondary: '#F7CE45',
        accent: 'rgba(0, 0, 0, 0.3)',
        danger: '#E80B26',
        dark: '#000000',
        border: '#F2F2F2',
      },
    },
  },
  plugins: [],
};
export default config;
