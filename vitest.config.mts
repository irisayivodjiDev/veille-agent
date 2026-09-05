import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./vitest.setup.mts'],
    include: ['**/*.test.mts'],
    exclude: ['node_modules/**', 'frontend/**'],
  },
});
