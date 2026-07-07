import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./tests/setup.ts"],
    // Friend-service tests hit a real Postgres instance (see tests/friends.test.ts);
    // run them one after another rather than in parallel workers.
    fileParallelism: false,
  },
});
