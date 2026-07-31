import { defineConfig } from "vitest/config";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "~core": resolve(__dirname, "./core"),
      "~workers": resolve(__dirname, "./app/workers"),
    },
  },
  test: {
    environment: "happy-dom",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["core/**/*.ts"],
      exclude: ["core/**/*.d.ts"],
    },
  },
});
