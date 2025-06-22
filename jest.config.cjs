module.exports = {
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.d.ts"
  ],
  coverageReporters: [
    "text",
    "html",
    "json-summary"
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 75,
      lines: 80,
      statements: 80
    }
  }
};
