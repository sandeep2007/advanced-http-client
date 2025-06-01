// example-node.js
// Example usage of http-client in Node.js (Node 18+ with native fetch)

import HttpClient from "./dist/esm/index.js";

function logHttpError(prefix, err) {
  if (err && err.response) {
    console.error(
      `${prefix}HTTP Error:`,
      err.response.status,
      err.response.statusText
    );
    console.error(`${prefix}Response data:`, err.response.data);
    console.error(`${prefix}Headers:`, err.response.headers);
  } else {
    console.error(`${prefix}Error:`, err);
  }
}

async function main() {
  // GET example (404)
  try {
    const response = await HttpClient.get(
      "https://jsonplaceholder.typicode.com/todos/1"
    );
    console.log("Fetched data:", response.data);
    console.log("Status:", response.status);
    console.log("Headers:", response.headers);
  } catch (err) {
    logHttpError("GET: ", err);
  }

  // POST example
  try {
    const postRes = await HttpClient.post(
      "https://jsonplaceholder.typicode.com/posts",
      { title: "foo", body: "bar", userId: 1 }
    );
    console.log("POST data:", postRes.data);
    console.log("POST status:", postRes.status);
  } catch (err) {
    logHttpError("POST: ", err);
  }

  // PATCH example
  try {
    const patchRes = await HttpClient.patch(
      "https://jsonplaceholder.typicode.com/posts/1",
      { title: "updated title" }
    );
    console.log("PATCH data:", patchRes.data);
    console.log("PATCH status:", patchRes.status);
  } catch (err) {
    logHttpError("PATCH: ", err);
  }

  // DELETE example
  try {
    const deleteRes = await HttpClient.delete(
      "https://jsonplaceholder.typicode.com/posts/1"
    );
    console.log("DELETE status:", deleteRes.status);
  } catch (err) {
    logHttpError("DELETE: ", err);
  }
}

main();
