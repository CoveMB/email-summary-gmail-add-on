import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      include: ['src/**/*.ts'],
      provider: 'v8',
      reporter: ['text'],
      thresholds: {
        branches: 75,
        functions: 80,
        lines: 90,
        statements: 90,
      },
    },
  },
});
