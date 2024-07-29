import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
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
