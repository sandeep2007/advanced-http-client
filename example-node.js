// example-node.js
// Example usage of http-client in Node.js (Node 18+ with native fetch)

import HttpClient from "./dist/esm/index.js";

async function main() {
  try {
    const response = await HttpClient.request(
      "https://jsonplaceholder.typicode.com/todos/1"
    );
    const data = await response.json();
    console.log("Fetched data:", data);
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
