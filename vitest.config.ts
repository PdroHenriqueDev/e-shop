import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./setupTests.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/*.{test,spec}.{ts,tsx,js,jsx}',
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '**/coverage/**',
        '**/*.config.{ts,js,mjs}',
        '**/setupTests.ts',
        '**/vitest.d.ts',
        '**/prisma/**',
        '**/public/**',
        '**/auth.ts',
        '**/middleware.ts',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
      include: ['src/**/*.{ts,tsx}'],
    },
  },
});
