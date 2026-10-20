export default [{
  files: ["**/*.js"],
  languageOptions: {
    ecmaVersion: 2022, sourceType: "module",
    globals: { window: "readonly", document: "readonly", localStorage: "readonly", FormData: "readonly", AbortController: "readonly", setTimeout: "readonly", clearTimeout: "readonly", globalThis: "readonly", Response: "readonly", Request: "readonly", fetch: "readonly" },
  },
  rules: { "no-undef": "error", "no-unused-vars": "error", eqeqeq: "error", "prefer-const": "error", "no-var": "error" },
}];
