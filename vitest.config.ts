import {configDefaults, defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      exclude: [
        ...configDefaults.exclude,
        '.next/**',
        './next.config.mjs',
        './.prettierrc.js',
        './postcss.config.mjs',
        './tailwind.config.ts',
      ],
    },
  },
});
