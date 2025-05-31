import HttpClient from "../src/index";

describe("HttpClient", () => {
  it("should perform a GET request and return a Response", async () => {
    // This test will only work in Node.js 18+ or environments with fetch
    const response = await HttpClient.request(
      "https://jsonplaceholder.typicode.com/todos/1"
    );
    expect(response).toBeDefined();
    expect(typeof response.json).toBe("function");
    const data = await response.json();
    expect(data).toHaveProperty("id", 1);
  });

  it("should throw if fetch is not available", async () => {
    // Save the original fetch
    const originalFetch = global.fetch;
    // @ts-ignore
    global.fetch = undefined;
    await expect(HttpClient.request("https://example.com")).rejects.toThrow(
      "fetch is not available in this environment"
    );
    // Restore fetch
    global.fetch = originalFetch;
  });
});
