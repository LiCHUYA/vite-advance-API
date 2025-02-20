import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "viteAdvanceApi",
      fileName: (format) => `index.${format}.js`,
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: [
        "express",
        "cors",
        "axios",
        "lodash",
        "uuid",
        "express-async-errors",
        "vite",
      ],
    },
    sourcemap: true,
    minify: "esbuild",
  },
  plugins: [dts()],
});
