const path = require("path");

module.exports = {
  entry: "./dist/esm/index.js",
  output: {
    filename: "http-client.js",
    path: path.resolve(__dirname, "dist/browser"),
    library: "HttpClient",
    libraryTarget: "umd",
    globalObject: "this",
    clean: true,
  },
  mode: "production",
  module: {
    rules: [],
  },
  resolve: {
    extensions: [".js"],
  },
};
