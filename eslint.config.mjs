import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      // This Next.js 16 rule newly flags existing state synchronization patterns.
      "react-hooks/set-state-in-effect": "off"
    }
  },
  {
    ignores: [
      ".next/**",
      ".codex-local/**",
      ".diagnostics/**",
      "coverage/**",
      "dist/**",
      "node_modules/**",
      "out/**",
      "next-env.d.ts",
      "*.zip"
    ]
  }
];

export default eslintConfig;
