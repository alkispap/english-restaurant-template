import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "var(--color-ink)",
        muted: "var(--color-muted)",
        line: "var(--color-line)",
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        accent: "var(--color-accent)",
        paper: "var(--color-paper)"
      },
      boxShadow: {
        soft: "0 16px 50px var(--shadow-soft-color, rgba(15, 23, 42, 0.08))"
      }
    }
  },
  plugins: []
};

export default config;
