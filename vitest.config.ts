import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  test: {
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'backend',
          environment: 'node',
          include: ['tests/backend/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'frontend',
          environment: 'jsdom',
          environmentOptions: { jsdom: { url: 'http://localhost/' } },
          setupFiles: ['tests/frontend/setup.ts'],
          include: ['tests/frontend/**/*.test.{ts,tsx}', 'tests/taskViews.test.ts', 'tests/taskService.test.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['cloudflare/src/**/*.ts', 'taskmanagerfront/src/**/*.{ts,tsx}'],
      exclude: ['**/*.d.ts', '**/types.ts'],
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      thresholds: { statements: 95, branches: 95, functions: 95, lines: 95 },
    },
  },
});
