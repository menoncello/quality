module.exports = {
  env: {
    browser: false,
    es2022: true,
    node: true
  },
  extends: ["eslint:recommended", "@typescript-eslint/recommended"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: "./tsconfig.json"
  },
  plugins: ["@typescript-eslint"],
  rules: {
    // TypeScript specific rules
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-non-null-assertion": "warn",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-optional-chain": "error",
    "@typescript-eslint/no-unnecessary-type-assertion": "error",
    "@typescript-eslint/no-unnecessary-type-constraint": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-call": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-unsafe-return": "error",

    // General best practices
    "no-console": "warn",
    "no-debugger": "error",
    "prefer-const": "error",
    "no-var": "error",
    "object-shorthand": "error",
    "prefer-template": "error",
    "template-curly-spacing": "error",

    // Code style
    indent: ["error", 2],
    quotes: ["error", "single"],
    semi: ["error", "always"],
    "comma-dangle": ["error", "never"],
    "max-len": ["warn", { code: 100 }],

    // Error handling
    "no-unreachable": "error",
    "no-empty": ["error", { allowEmptyCatch: true }],
    "use-isnan": "error",

    // Security
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-new-func": "error",

    // Performance
    "no-loop-func": "error",
    "no-constant-condition": ["error", { checkLoops: false }]
  },
  overrides: [
    {
      files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
      env: {
        jest: true
      },
      rules: {
        "@typescript-eslint/no-explicit-any": "warn",
        "no-console": "off"
      }
    },
    {
      files: ["**/*.tsx"],
      rules: {
        "react/prop-types": "off"
      }
    }
  ]
};
