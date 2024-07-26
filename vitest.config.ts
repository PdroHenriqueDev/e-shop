import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./setupTests.ts'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/*test.tsx',
        '.next/**',
        './next.config.mjs',
        './.prettierrc.js',
        './postcss.config.mjs',
        './tailwind.config.ts',
        'setupTests.ts',
      ],
    },
  },
});
