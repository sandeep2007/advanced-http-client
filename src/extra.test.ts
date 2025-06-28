import { HttpClient, HttpClientError } from "./index";

// Utility to create a fake fetch Response-like object
function createFakeResponse({
  body,
  status = 200,
  statusText = "OK",
  contentType = "application/json",
}: {
  body: unknown;
  status?: number;
  statusText?: string;
  contentType?: string;
}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers: {
      get: (name: string) => (name.toLowerCase() === "content-type" ? contentType : undefined),
      forEach: (_cb: any) => {},
    },
    json: async () => body,
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
    formData: async () => body,
    blob: async () => body,
    arrayBuffer: async () => body,
  } as unknown as Response;
}

describe("Additional coverage for HttpClient internals", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    // Reset global headers to avoid pollution between tests
    // @ts-ignore accessing private for test only
    HttpClient.globalHeaders = {};
  });

  it("should parse BLOB and ARRAY_BUFFER content types correctly", async () => {
    const client = HttpClient.create();

    // Mock fetch for BLOB
    const blobData = "blob-data";
    const fetchSpy = jest.spyOn(global as any, "fetch");
    fetchSpy.mockResolvedValueOnce(createFakeResponse({
      body: blobData,
      contentType: "application/blob",
    }));

    const blobRes = await client.get("/blob-test");
    expect(blobRes.data).toBe(blobData);

    // Mock fetch for ARRAY_BUFFER
    const bufferData = new ArrayBuffer(8);
    fetchSpy.mockResolvedValueOnce(createFakeResponse({
      body: bufferData,
      contentType: "application/arraybuffer",
    }));

    const bufferRes = await client.get("/arraybuffer-test");
    expect(bufferRes.data).toBe(bufferData);
  });

  it("should convert Headers instance to plain object in mergeConfig", async () => {
    // Provide a minimal Headers polyfill if not present (Jest Node env)
    if (typeof global.Headers === "undefined") {
      // @ts-ignore create simple polyfill
      global.Headers = class FakeHeaders {
        private map: [string, string][];
        constructor(init: [string, string][]) {
          this.map = init.map(([k, v]) => [k.toLowerCase(), v]);
        }
        forEach(cb: (_value: string, _key: string) => void) {
          this.map.forEach(([_k, _v]) => cb(_v, _k));
        }
      };
    }

    const hdrs = new Headers([["X-Custom", "yes"]]);

    const client = HttpClient.create();
    const fetchSpy = jest.spyOn(global as any, "fetch").mockResolvedValueOnce(
      createFakeResponse({ body: { ok: true } })
    );

    await client.get("/headers-test", { headers: hdrs });

    const optionsPassed = fetchSpy.mock.calls[0][1] as any;
    expect(optionsPassed?.headers["X-Custom"] ?? optionsPassed?.headers["x-custom"]).toBe("yes");
  });

  it("should keep existing Accept header untouched", async () => {
    const client = HttpClient.create();
    const fetchSpy = jest.spyOn(global as any, "fetch").mockResolvedValueOnce(
      createFakeResponse({ body: { ok: true } })
    );

    await client.get("/accept-test", {
      headers: { Accept: "text/plain" },
    });

    const optionsPassed = fetchSpy.mock.calls[0][1] as any;
    expect(optionsPassed?.headers.Accept).toBe("text/plain");
  });

  it("should manage error interceptors (use, eject, clear)", async () => {
    const client = HttpClient.create();

    // Add an error interceptor that rewrites the message
    const id = client.interceptors.error.use((err) => {
      err.message = "intercepted";
      return err;
    });

    // Mock fetch to return 500 error
    jest.spyOn(global as any, "fetch").mockResolvedValueOnce(
      createFakeResponse({ body: { ok: false }, status: 500, statusText: "ERR" })
    );

    try {
      await client.get("/error-test");
    } catch (error) {
      const e = error as HttpClientError;
      expect(e.message).toBe("intercepted");
    }

    // Eject interceptor and ensure it's cleared
    client.interceptors.error.eject(id);
    expect(client.interceptors.error.handlers[id]).toEqual({});

    // Clear all interceptors
    client.interceptors.error.clear();
    expect(client.interceptors.error.handlers.length).toBe(0);
  });

  it("should invoke request interceptor rejected handler", async () => {
    const client = HttpClient.create();

    let capturedConfig: any;

    // First interceptor throws to trigger rejection
    client.interceptors.request.use((cfg) => {
      capturedConfig = cfg;
      throw new Error("fail-request");
    });

    // Second interceptor handles the rejection and provides a valid config
    client.interceptors.request.use(undefined as any, () => capturedConfig);

    // Mock fetch so the request continues
    jest.spyOn(global as any, "fetch").mockResolvedValueOnce(
      createFakeResponse({ body: { ok: true } })
    );

    const res = await client.get("/interceptor-reject");
    expect(res.status).toBe(200);
  });

  it("should invoke response interceptor rejected handler", async () => {
    const client = HttpClient.create();

    let rejectedCalled = false;

    // Response interceptor that throws
    client.interceptors.response.use((_response) => {
      throw new Error("fail-response");
    });

    // Next interceptor catches the error (rejected handler)
    client.interceptors.response.use(undefined as any, (err: any) => {
      rejectedCalled = true;
      return Promise.reject(err);
    });

    jest.spyOn(global as any, "fetch").mockResolvedValueOnce(
      createFakeResponse({ body: { ok: true } })
    );

    await expect(client.get("/resp-interceptor-reject")).rejects.toBeDefined();
    expect(rejectedCalled).toBe(true);
  });

  it("should use fallback parser when content-type is unknown", async () => {
    const client = HttpClient.create();

    const textBody = "plain text body";
    jest.spyOn(global as any, "fetch").mockResolvedValueOnce(
      createFakeResponse({ body: textBody, contentType: "application/unknown" })
    );

    const res = await client.get("/unknown-content-type");
    expect(res.data).toBe(textBody);
  });

  it("should parse FORM content-type correctly", async () => {
    const client = HttpClient.create();

    // Minimal FormData polyfill for Node test env
    if (typeof (global as any).FormData === "undefined") {
      // @ts-ignore create stub
      (global as any).FormData = class {};
    }

    const formDataObj = { field: "value" } as unknown as FormData;
    jest.spyOn(global as any, "fetch").mockResolvedValueOnce(
      createFakeResponse({ body: formDataObj, contentType: "multipart/form-data" })
    );

    const res = await client.get("/form-test");
    expect(res.data).toBe(formDataObj);
  });

  it("should merge global headers when not overridden", async () => {
    HttpClient.setHeader("X-Global-Only", "g-val");
    const client = HttpClient.create();

    const fetchSpy = jest.spyOn(global as any, "fetch").mockResolvedValueOnce(
      createFakeResponse({ body: { ok: true } })
    );

    await client.get("/global-header-merge");

    const opts = fetchSpy.mock.calls[0][1] as any;
    expect(opts.headers["X-Global-Only"].toLowerCase()).toBe("g-val");
  });

  it("should build URL using baseURL when relative path is supplied", async () => {
    const client = HttpClient.create({ baseURL: "https://api.example.com/" });

    const fetchSpy = jest.spyOn(global as any, "fetch").mockResolvedValueOnce(
      createFakeResponse({ body: { ok: true } })
    );

    await client.get("users/123");

    const urlCalled = fetchSpy.mock.calls[0][0] as string;
    expect(urlCalled).toBe("https://api.example.com/users/123");
  });

  it("should execute fallback _rejected handler when none supplied", async () => {
    const client = HttpClient.create();

    // First interceptor causes rejection
    client.interceptors.request.use((_cfg) => Promise.reject(new Error("reject")));

    // Second interceptor has no _rejected handler
    client.interceptors.request.use((_cfg2) => _cfg2);

    jest.spyOn(global as any, "fetch").mockResolvedValueOnce(
      createFakeResponse({ body: { ok: true } })
    );

    await expect(client.get("/fallback-rejected")).rejects.toBeDefined();
  });

  it("should execute default _fulfilled handler when none supplied", async () => {
    const client = HttpClient.create();

    // Interceptor with neither fulfilled nor rejected handler
    client.interceptors.request.use();

    jest.spyOn(global as any, "fetch").mockResolvedValueOnce(
      createFakeResponse({ body: { ok: true } })
    );

    const res = await client.get("/default-fulfilled");
    expect(res.status).toBe(200);
  });

  it("should apply global header when not overridden (line 235,237)", async () => {
    // Reset and set a unique header
    // @ts-ignore access private
    HttpClient.globalHeaders = {};
    HttpClient.setHeader("X-G-Cover", "cover-val");

    const client = HttpClient.create();
    const fetchSpy = jest.spyOn(global as any, "fetch").mockResolvedValueOnce(
      createFakeResponse({ body: { ok: true } })
    );

    await client.get("/global-cover");

    const opts = fetchSpy.mock.calls[0][1] as any;
    expect(opts.headers["X-G-Cover"]).toBe("cover-val");
  });

  it("should hit default _fulfilled / _rejected in executeRequestInterceptors (line 306-307)", async () => {
    const client = HttpClient.create();

    // Add an interceptor with neither fulfilled nor rejected handlers
    client.interceptors.request.use();

    // Mock fetch
    jest.spyOn(global as any, "fetch").mockResolvedValueOnce(
      createFakeResponse({ body: { ok: true } })
    );

    const res = await client.get("/default-interceptor");
    expect(res.status).toBe(200);
  });

  it("should abort the request when timeout elapses", async () => {
    jest.useFakeTimers();
    jest.setTimeout(10000);

    const client = HttpClient.create();

    // mock fetch that rejects when aborted but otherwise never resolves
    (jest.spyOn(global as any, "fetch") as any).mockImplementation((_u: string, opts: any) => {
      return new Promise((_resolve, reject) => {
        if (opts && opts.signal) {
          opts.signal.addEventListener("abort", () => {
            reject(new Error("aborted"));
          });
        }
      });
    });

    const reqPromise = client.get("/timeout", { timeout: 100 } as any).catch((e)=>{return e;});

    // Advance timers beyond timeout
    await jest.advanceTimersByTimeAsync(150);

    const err = await reqPromise;
    expect(err).toBeDefined();

    jest.useRealTimers();
  });

  // ------------------------------------------------------------------
  // controlKey cancellation feature
  // ------------------------------------------------------------------

  function createHangingFetchMock() {
    return (jest.spyOn(global as any, "fetch") as any).mockImplementation((_u: string, opts: any) => {
      return new Promise((_resolve, reject) => {
        if (opts && opts.signal) {
          opts.signal.addEventListener("abort", () => {
            reject(new Error("aborted"));
          });
        }
      });
    });
  }

  it("should cancel request via HttpClient.cancelRequest", async () => {
    const client = HttpClient.create();

    createHangingFetchMock();

    jest.setTimeout(10000);
    const p = client.get("/hang", { controlKey: "inst1" } as any).catch((e) => e);

    // Allow async execution to register controller
    await new Promise((r)=>globalThis.setImmediate(r));

    HttpClient.cancelRequest("inst1");

    const err = await p;
    expect(err).toBeDefined();
    expect(client["controllers"].has("inst1")).toBe(false);
  });

  it("should cancel all requests via HttpClient.cancelAllRequests", async () => {
    const client = HttpClient.create();
    createHangingFetchMock();

    jest.setTimeout(10000);
    const p1 = client.get("/hang1", { controlKey: "k1" } as any).catch((e) => e);
    const p2 = client.get("/hang2", { controlKey: "k2" } as any).catch((e) => e);

    await new Promise((r)=>globalThis.setImmediate(r));

    HttpClient.cancelAllRequests();

    const e1 = await p1;
    const e2 = await p2;
    expect(e1).toBeDefined();
    expect(e2).toBeDefined();
    expect(client["controllers"].size).toBe(0);
  });

  it("should throw error on duplicate controlKey", async () => {
    const client = HttpClient.create();
    createHangingFetchMock();

    jest.setTimeout(10000);
    client.get("/hang", { controlKey: "dupKey" } as any).catch(() => {});

    await new Promise((r)=>globalThis.setImmediate(r));

    await expect(
      client.get("/hang2", { controlKey: "dupKey" } as any)
    ).rejects.toThrow(/already in use/);
  });

  it("should generate 20-character alphanumeric controlKey", () => {
    const key = HttpClient.generateControlKey();
    expect(key).toMatch(/^[A-Za-z0-9]{20}$/);
  });

  it("should cancel hanging request without controlKey using cancelAllRequests", async () => {
    const client = HttpClient.create();
    createHangingFetchMock();
    const p = client.get("/no-key-hang").catch((e)=>e);
    await new Promise((r)=>globalThis.setImmediate(r));
    HttpClient.cancelAllRequests();
    const err = await p;
    expect(err).toBeDefined();
  });
}); 