import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  build: {
    chunkSizeWarningLimit: 1600,
  },
});
