const path = require("path");

module.exports = {
  entry: "./dist/esm/index.js",
  output: {
    filename: "http-client.js",
    path: path.resolve(__dirname, "dist/browser"),
    library: {
      name: "HttpClient",
      type: "umd",
      export: "default",
    },
    globalObject: "typeof self !== 'undefined' ? self : this",
    clean: true,
  },
  mode: "production",
  devtool: "source-map",
  module: {
    rules: [],
  },
  resolve: {
    extensions: [".js"],
  },
  optimization: {
    minimize: true,
  },
};
