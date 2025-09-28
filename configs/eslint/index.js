module.exports = {
  ...require("./base"),
  env: {
    ...require("./base").env,
    jest: true
  },
  ignorePatterns: ["dist/", "node_modules/", "coverage/", "build/", "*.d.ts"]
};
