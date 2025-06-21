import { HttpClient, HttpClientError, ExtendedRequestInit } from "./index";

describe("HttpClient", () => {
  const baseUrl = "https://jsonplaceholder.typicode.com";

  afterEach(() => {
    // Reset global headers to avoid test pollution
    (HttpClient as any).globalHeaders = {};
  });

  describe("Static Methods", () => {
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

    it("should throw error for non-2xx response", async () => {
      expect.assertions(2);
      try {
        await HttpClient.get(`${baseUrl}/notfound`);
      } catch (err: unknown) {
        const error = err as HttpClientError;
        expect(error).toBeInstanceOf(Error);
        expect(error.response.status).toBe(404);
      }
    });

    it("should set global headers and send them with requests", async () => {
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
  });

  describe("Instance Methods", () => {
    it("should GET data successfully", async () => {
      const client = HttpClient.create({ baseURL: baseUrl });
      const res = await client.get("/todos/1");
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty("id", 1);
      expect(res.config.url).toContain("/todos/1");
    });

    it("should POST data successfully", async () => {
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

    it("should PATCH data successfully", async () => {
      const client = HttpClient.create({ baseURL: baseUrl });
      const res = await client.patch("/posts/1", { title: "patched title" });
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty("title", "patched title");
    });

    it("should DELETE data successfully", async () => {
      const client = HttpClient.create({ baseURL: baseUrl });
      const res = await client.delete("/posts/1");
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(300);
    });

    it("should support DELETE with body", async () => {
      const client = HttpClient.create({ baseURL: baseUrl });
      const res = await client.delete("/posts/1", { foo: "bar" });
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(300);
    });
  });

  describe("Configuration and Headers", () => {
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
      const res = await client.get("https://jsonplaceholder.typicode.com/todos/1");
      expect(res.status).toBe(200);
      expect(res.config.url).toBe("https://jsonplaceholder.typicode.com/todos/1");
    });

    it("should handle baseURL with trailing slash", async () => {
      const client = HttpClient.create({ baseURL: "https://api.example.com/" });
      const spy = jest.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: { get: () => "application/json", forEach: () => {} },
        json: async () => ({ id: 1 }),
      } as any);
      await client.get("users/1");
      const fetchArgs = spy.mock.calls[0];
      expect(fetchArgs[0]).toBe("https://api.example.com/users/1");
      spy.mockRestore();
    });

    it("should handle baseURL without trailing slash", async () => {
      const client = HttpClient.create({ baseURL: "https://api.example.com" });
      const spy = jest.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: { get: () => "application/json", forEach: () => {} },
        json: async () => ({ id: 1 }),
      } as any);
      await client.get("/users/1");
      const fetchArgs = spy.mock.calls[0];
      expect(fetchArgs[0]).toBe("https://api.example.com/users/1");
      spy.mockRestore();
    });

    it("should set default Accept header when not provided", async () => {
      const client = HttpClient.create();
      const spy = jest.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: { get: () => "application/json", forEach: () => {} },
        json: async () => ({ id: 1 }),
      } as any);
      await client.get("/test");
      const fetchArgs = spy.mock.calls[0][1];
      expect(fetchArgs?.headers).toHaveProperty("Accept", "application/json");
      spy.mockRestore();
    });

    it("should not override user-provided Accept header", async () => {
      const client = HttpClient.create();
      const spy = jest.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: { get: () => "application/json", forEach: () => {} },
        json: async () => ({ id: 1 }),
      } as any);
      await client.get("/test", {
        headers: { Accept: "text/plain" },
      });
      const fetchArgs = spy.mock.calls[0][1];
      expect(fetchArgs?.headers).toHaveProperty("Accept", "text/plain");
      spy.mockRestore();
    });
  });

  describe("Isolated Mode", () => {
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
        } as ExtendedRequestInit
      );
      const headers =
        res.config.options && typeof res.config.options.headers === "object"
          ? (res.config.options.headers as Record<string, string>)
          : {};
      expect(headers["Authorization"]).toBeUndefined();
      expect(headers["X-Instance"]).toBeUndefined();
      expect(headers["X-Isolated"]).toBe("yes");
      expect(headers["Accept"]).toBeUndefined();
    });

    it("should include only specified headers from global/instance in isolated mode", async () => {
      HttpClient.setHeader("X-Global", "global-value");
      const client = HttpClient.create({
        headers: {
          "X-Instance": "instance-value",
          "X-Common": "instance-common",
        },
      });
      const spy = jest.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: { get: () => "application/json", forEach: () => {} },
        json: async () => ({ ok: true }),
      } as any);
      await client.get("/test", {
        isolated: true,
        includeHeaders: ["X-Global", "X-Instance"],
        headers: { "X-Request": "request-value" },
      } as ExtendedRequestInit);
      const fetchArgs = spy.mock.calls[0][1];
      expect(fetchArgs?.headers).toHaveProperty("X-Global", "global-value");
      expect(fetchArgs?.headers).toHaveProperty("X-Instance", "instance-value");
      expect(fetchArgs?.headers).toHaveProperty("X-Request", "request-value");
      expect(fetchArgs?.headers).not.toHaveProperty("X-Common");
      spy.mockRestore();
    });

    it("should not include any global/instance headers if includeHeaders is not set in isolated mode", async () => {
      HttpClient.setHeader("X-Global2", "global2-value");
      const client = HttpClient.create({
        headers: { "X-Instance2": "instance2-value" },
      });
      const spy = jest.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: { get: () => "application/json", forEach: () => {} },
        json: async () => ({ ok: true }),
      } as any);
      await client.get("/test", {
        isolated: true,
        headers: { "X-Request": "request-value" },
      } as ExtendedRequestInit);
      const fetchArgs = spy.mock.calls[0][1];
      expect(fetchArgs?.headers).not.toHaveProperty("X-Global2");
      expect(fetchArgs?.headers).not.toHaveProperty("X-Instance2");
      expect(fetchArgs?.headers).toHaveProperty("X-Request", "request-value");
      spy.mockRestore();
    });
  });

  describe("Error Handling", () => {
    it("should throw error for 500 response", async () => {
      expect.assertions(2);
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        headers: {
          forEach: () => {},
          get: () => "application/json",
        },
        json: async () => ({ error: "Internal Server Error" }),
      } as any);

      try {
        await HttpClient.get("https://example.com/api");
      } catch (err: unknown) {
        const error = err as HttpClientError;
        expect(error).toBeInstanceOf(Error);
        expect(error.response.status).toBe(500);
      } finally {
        global.fetch = originalFetch;
      }
    });

    it("should throw error for 400 response", async () => {
      expect.assertions(2);
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        headers: {
          forEach: () => {},
          get: () => "application/json",
        },
        json: async () => ({ error: "Bad Request" }),
      } as any);

      try {
        await HttpClient.get("https://example.com/api");
      } catch (err: unknown) {
        const error = err as HttpClientError;
        expect(error).toBeInstanceOf(Error);
        expect(error.response.status).toBe(400);
      } finally {
        global.fetch = originalFetch;
      }
    });

    it("should handle fetch not being available", async () => {
      const originalFetch = global.fetch;
      (global as any).fetch = undefined;
      
      const client = HttpClient.create();
      await expect(client.get("/test")).rejects.toThrow(
        "fetch is not available in this environment"
      );
      
      global.fetch = originalFetch;
    });
  });

  describe("Content Type Handling", () => {
    it("should handle different content types correctly", async () => {
      const originalFetch = global.fetch;
      
      // Test JSON response
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: {
          forEach: () => {},
          get: () => "application/json",
        },
        json: async () => ({ message: "JSON response" }),
        text: async () => "",
        formData: async () => undefined,
        blob: async () => undefined,
        arrayBuffer: async () => undefined,
      } as any);

      const client = HttpClient.create();
      const jsonRes = await client.get("/api/json");
      expect(jsonRes.data).toEqual({ message: "JSON response" });

      // Test text response
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: {
          forEach: () => {},
          get: () => "text/plain",
        },
        json: async () => undefined,
        text: async () => "Plain text response",
        formData: async () => undefined,
        blob: async () => undefined,
        arrayBuffer: async () => undefined,
      } as any);

      const textRes = await client.get("/api/text");
      expect(textRes.data).toBe("Plain text response");

      // Test fallback to text
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: {
          forEach: () => {},
          get: () => "unknown/type",
        },
        json: async () => undefined,
        text: async () => "Fallback text",
        formData: async () => undefined,
        blob: async () => undefined,
        arrayBuffer: async () => undefined,
      } as any);

      const fallbackRes = await client.get("/api/fallback");
      expect(fallbackRes.data).toBe("Fallback text");

      global.fetch = originalFetch;
    });
  });

  describe("Request Methods", () => {
    it("should handle request method override", async () => {
      const client = HttpClient.create();
      const spy = jest.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: { get: () => "application/json", forEach: () => {} },
        json: async () => ({ id: 1 }),
      } as any);
      await client.request("/todos/1", { method: "PUT" });
      const fetchArgs = spy.mock.calls[0][1];
      expect(fetchArgs?.method).toBe("PUT");
      spy.mockRestore();
    });

    it("should handle request with body", async () => {
      const client = HttpClient.create();
      const body = { test: "data" };
      const spy = jest.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: { get: () => "application/json", forEach: () => {} },
        json: async () => ({ id: 1 }),
      } as any);
      await client.request("/posts", { 
        method: "POST", 
        body: JSON.stringify(body) 
      });
      const fetchArgs = spy.mock.calls[0][1];
      expect(fetchArgs?.body).toBe(JSON.stringify(body));
      spy.mockRestore();
    });
  });
}); 