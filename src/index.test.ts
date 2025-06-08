jest.setTimeout(15000); // Increase timeout for slow network or API

import { HttpClient } from "./index";

describe("HttpClient", () => {
  const baseUrl = "https://jsonplaceholder.typicode.com";

  afterEach(() => {
    // Reset global headers to avoid test pollution
    (HttpClient as any).globalHeaders = {};
  });

  it("should GET data successfully (static)", async () => {
    const res = await HttpClient.get(`${baseUrl}/todos/1`);
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("id", 1);
    expect(res.headers).toBeDefined();
    expect(res.config.url).toContain("/todos/1");
  });

  it("should POST data successfully (static)", async () => {
    const res = await HttpClient.post(`${baseUrl}/posts`, {
      title: "foo",
      body: "bar",
      userId: 1,
    });
    expect(res.status).toBe(201);
    expect(res.data).toHaveProperty("id");
    expect(res.data).toMatchObject({ title: "foo", body: "bar", userId: 1 });
  });

  it("should PATCH data successfully (static)", async () => {
    const res = await HttpClient.patch(`${baseUrl}/posts/1`, {
      title: "patched title",
    });
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("title", "patched title");
  });

  it("should DELETE data successfully (static)", async () => {
    const res = await HttpClient.delete(`${baseUrl}/posts/1`);
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it("should throw error for non-2xx response (404) (static)", async () => {
    expect.assertions(2);
    try {
      await HttpClient.get(`${baseUrl}/notfound`);
    } catch (err: any) {
      expect(err).toBeInstanceOf(Error);
      expect(err.response.status).toBe(404);
    }
  });

  it("should throw error for 500 response (static)", async () => {
    expect.assertions(2);
    try {
      await HttpClient.get("https://httpstat.us/500");
    } catch (err: any) {
      expect(err).toBeInstanceOf(Error);
      expect(err.response.status).toBe(500);
    }
  });

  it("should throw error for 400 response (static)", async () => {
    expect.assertions(2);
    try {
      await HttpClient.get("https://httpstat.us/400");
    } catch (err: any) {
      expect(err).toBeInstanceOf(Error);
      expect(err.response.status).toBe(400);
    }
  });

  it("should set global headers and send them with requests (static)", async () => {
    HttpClient.setHeader("Authorization", "Bearer TEST_TOKEN");
    HttpClient.setHeader("X-Test-Header", "test-value");
    const res = await HttpClient.get(`${baseUrl}/todos/1`);
    const headers =
      res.config.options && typeof res.config.options.headers === "object"
        ? (res.config.options.headers as Record<string, string>)
        : {};
    expect(headers["Authorization"]).toBe("Bearer TEST_TOKEN");
    expect(headers["X-Test-Header"]).toBe("test-value");
  });

  // Instance API tests
  it("should GET data successfully (instance)", async () => {
    const client = HttpClient.create({ baseURL: baseUrl });
    const res = await client.get("/todos/1");
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("id", 1);
    expect(res.config.url).toContain("/todos/1");
  });

  it("should POST data successfully (instance)", async () => {
    const client = HttpClient.create({ baseURL: baseUrl });
    const res = await client.post("/posts", {
      title: "foo",
      body: "bar",
      userId: 1,
    });
    expect(res.status).toBe(201);
    expect(res.data).toHaveProperty("id");
    expect(res.data).toMatchObject({ title: "foo", body: "bar", userId: 1 });
  });

  it("should PATCH data successfully (instance)", async () => {
    const client = HttpClient.create({ baseURL: baseUrl });
    const res = await client.patch("/posts/1", { title: "patched title" });
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("title", "patched title");
  });

  it("should DELETE data successfully (instance)", async () => {
    const client = HttpClient.create({ baseURL: baseUrl });
    const res = await client.delete("/posts/1");
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it("should allow per-request headers to override instance/global headers", async () => {
    HttpClient.setHeader("X-Global-Header", "global-value");
    const client = HttpClient.create({
      baseURL: baseUrl,
      headers: { "X-Instance-Header": "instance-value" },
    });
    const res = await client.get("/todos/1", {
      headers: {
        "X-Request-Header": "request-value",
        "X-Instance-Header": "overridden",
      },
    });
    const headers =
      res.config.options && typeof res.config.options.headers === "object"
        ? (res.config.options.headers as Record<string, string>)
        : {};
    expect(headers["X-Global-Header"]).toBe("global-value");
    expect(headers["X-Instance-Header"]).toBe("overridden");
    expect(headers["X-Request-Header"]).toBe("request-value");
  });

  it("should not prepend baseURL for absolute URLs", async () => {
    const client = HttpClient.create({ baseURL: baseUrl });
    const res = await client.get(
      "https://jsonplaceholder.typicode.com/todos/1"
    );
    expect(res.status).toBe(200);
    expect(res.config.url).toBe("https://jsonplaceholder.typicode.com/todos/1");
  });

  it("should support DELETE with body", async () => {
    const client = HttpClient.create({ baseURL: baseUrl });
    const res = await client.delete("/posts/1", { foo: "bar" });
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it("should ignore all global, instance, and default settings when isolated is true", async () => {
    HttpClient.setHeader("Authorization", "SHOULD_NOT_BE_SENT");
    const client = HttpClient.create({
      baseURL: baseUrl,
      headers: { "X-Instance": "SHOULD_NOT_BE_SENT" },
    });
    const res = await client.post(
      "https://jsonplaceholder.typicode.com/posts",
      { title: "iso", body: "test", userId: 99 },
      {
        headers: { "X-Isolated": "yes" },
        isolated: true,
      } as any // Cast to any to allow custom option
    );
    // Should only have the explicitly provided header, not global or instance
    const headers =
      res.config.options && typeof res.config.options.headers === "object"
        ? (res.config.options.headers as Record<string, string>)
        : {};
    expect(headers["Authorization"]).toBeUndefined();
    expect(headers["X-Instance"]).toBeUndefined();
    expect(headers["X-Isolated"]).toBe("yes");
    // Should not have default Accept header unless user set it
    expect(headers["Accept"]).toBeUndefined();
  });
});

describe("HttpClient isolated mode with includeHeaders", () => {
  it("should include only specified headers from global/instance in isolated mode", async () => {
    HttpClient.setHeader("X-Global", "global-value");
    const client = HttpClient.create({
      headers: {
        "X-Instance": "instance-value",
        "X-Common": "instance-common",
      },
    });
    // Should only include X-Global and X-Instance, not X-Common, not X-Other
    const spy = jest.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({ ok: true }),
      text: async () => "", // mock text for parseResponseBody fallback
      headers: {
        forEach: (_cb: any) => {},
        get: () => undefined, // mock get for parseResponseBody
      },
    } as any);
    await client.get("/test", {
      isolated: true,
      includeHeaders: ["X-Global", "X-Instance"],
      headers: { "X-Request": "request-value" },
    } as any);
    const fetchArgs = spy.mock.calls[0][1];
    // Convert headers to a plain object if it's a Headers instance
    let headersObj: Record<string, string> = {};
    if (fetchArgs?.headers) {
      if (fetchArgs.headers instanceof Headers) {
        fetchArgs.headers.forEach(
          (v: string, k: string) => (headersObj[k] = v)
        );
      } else if (Array.isArray(fetchArgs.headers)) {
        fetchArgs.headers.forEach(
          ([k, v]: [string, string]) => (headersObj[k] = v)
        );
      } else {
        headersObj = fetchArgs.headers;
      }
    }

    expect(headersObj["X-Global"]).toBe("global-value");
    expect(headersObj["X-Instance"]).toBe("instance-value");
    expect(headersObj["X-Request"]).toBe("request-value");
    expect(headersObj["X-Common"]).toBeUndefined();
    spy.mockRestore();
  });

  it("should not include any global/instance headers if includeHeaders is not set in isolated mode", async () => {
    HttpClient.setHeader("X-Global2", "global2-value");
    const client = HttpClient.create({
      headers: { "X-Instance2": "instance2-value" },
    });
    const spy = jest.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({ ok: true }),
      text: async () => "", // mock text for parseResponseBody fallback
      headers: {
        forEach: (_cb: any) => {},
        get: () => undefined, // mock get for parseResponseBody
      },
    } as any);
    await client.get("/test", {
      isolated: true,
      headers: { "X-Request": "request-value" },
    } as any);
    const fetchArgs = spy.mock.calls[0][1];
    let headersObj: Record<string, string> = {};
    if (fetchArgs?.headers) {
      if (fetchArgs.headers instanceof Headers) {
        fetchArgs.headers.forEach(
          (v: string, k: string) => (headersObj[k] = v)
        );
      } else if (Array.isArray(fetchArgs.headers)) {
        fetchArgs.headers.forEach(
          ([k, v]: [string, string]) => (headersObj[k] = v)
        );
      } else {
        headersObj = fetchArgs.headers;
      }
    }
    expect(headersObj["X-Global2"]).toBeUndefined();
    expect(headersObj["X-Instance2"]).toBeUndefined();
    expect(headersObj["X-Request"]).toBe("request-value");
    spy.mockRestore();
  });
});
