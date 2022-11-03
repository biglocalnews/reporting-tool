module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    sourceType: "module", // Allows for the use of imports
    ecmaFeatures: {
      jsx: true, // Allows for the parsing of JSX
    },
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  extends: [
    "eslint:recommended", // Turns on a small, sensible set of rules which lint for well-known best-practices
    "plugin:react/recommended", // Uses the recommended rules from @eslint-plugin-react
    "plugin:@typescript-eslint/recommended", // Uses the recommended rules from @typescript-eslint/eslint-plugin
    "plugin:jsx-a11y/strict", // Enforce strict accessibility rules
    "prettier", // Turns off all rules that are unnecessary or might conflict with Prettier
  ],
  plugins: ["react-hooks"],
  ignorePatterns: ["src/setupProxy.js"],
  rules: {
    "react/jsx-uses-react": "off",
    "react/react-in-jsx-scope": "off",
    "react/display-name": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "no-unused-vars": "off",
    "no-debugger": "off",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/ban-ts-comment": "warn",
    // NOTE: The label-has-associated-control rule replaced the deprecated
    // label-has-for rule:
    // https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/master/docs/rules/label-has-for.md
    "jsx-a11y/label-has-associated-control": [
      2,
      {
        labelAttributes: ["label"],
        controlComponents: ["*Input*"],
        depth: 3,
      },
    ],
    "jsx-a11y/label-has-for": "off",
    "jsx-a11y/no-autofocus": "warn"
  },
};
