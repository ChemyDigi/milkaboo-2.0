import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // React Three Fiber animates by mutating three.js objects inside useFrame, outside React's render.
    // That is the library's intended pattern, and exactly what this React Compiler rule forbids.
    files: ["components/three/**"],
    rules: { "react-hooks/immutability": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // installed agent skills and their working files are not project code
    ".agents/**",
    ".claude/**",
    ".taste-skill/**",
  ]),
]);

export default eslintConfig;
