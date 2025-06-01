module.exports = {
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
};
