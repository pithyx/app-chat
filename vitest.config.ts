import { defineConfig } from 'vitest/config';

// Unit tests only: without the Pithyx plugin, which would start the backend with Docker as `npm run dev` does.
export default defineConfig({
  test: { include: ['src/**/*.test.ts', 'backend/server/src/**/*.test.ts'] },
});
