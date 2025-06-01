import HttpClient from "./index";

describe("HttpClient", () => {
  const baseUrl = "https://jsonplaceholder.typicode.com";

  it("should GET data successfully", async () => {
    const res = await HttpClient.get(`${baseUrl}/todos/1`);
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("id", 1);
    expect(res.headers).toBeDefined();
    expect(res.config.url).toContain("/todos/1");
  });

  it("should POST data successfully", async () => {
    const res = await HttpClient.post(`${baseUrl}/posts`, {
      title: "foo",
      body: "bar",
      userId: 1,
    });
    expect(res.status).toBe(201);
    expect(res.data).toHaveProperty("id");
    expect(res.data).toMatchObject({ title: "foo", body: "bar", userId: 1 });
  });

  it("should PATCH data successfully", async () => {
    const res = await HttpClient.patch(`${baseUrl}/posts/1`, {
      title: "patched title",
    });
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("title", "patched title");
  });

  it("should DELETE data successfully", async () => {
    const res = await HttpClient.delete(`${baseUrl}/posts/1`);
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it("should throw error for non-2xx response (404)", async () => {
    expect.assertions(2);
    try {
      await HttpClient.get(`${baseUrl}/notfound`);
    } catch (err: any) {
      expect(err).toBeInstanceOf(Error);
      expect(err.response.status).toBe(404);
    }
  });

  it("should throw error for 500 response", async () => {
    expect.assertions(2);
    try {
      await HttpClient.get("https://httpstat.us/500");
    } catch (err: any) {
      expect(err).toBeInstanceOf(Error);
      expect(err.response.status).toBe(500);
    }
  });

  it("should throw error for 400 response", async () => {
    expect.assertions(2);
    try {
      await HttpClient.get("https://httpstat.us/400");
    } catch (err: any) {
      expect(err).toBeInstanceOf(Error);
      expect(err.response.status).toBe(400);
    }
  });
});
