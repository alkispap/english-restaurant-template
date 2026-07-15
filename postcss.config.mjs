import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const scrollSnapPlugin = path.join(rootDir, "scripts", "postcss-remove-tailwind-global-scroll-snap-strictness.cjs");

const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    [scrollSnapPlugin]: {}
  }
};

export default config;
