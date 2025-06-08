# advance-http-client

A universal, modern HTTP client library using `fetch` for JavaScript and TypeScript projects. Works seamlessly in Node.js (18+), browsers, and modern JS runtimes/frameworks (React, Next.js, Vue, Bun, etc.).

- **ESM, CJS, and UMD builds**
- **TypeScript support**
- **Flexible API and error handling**
- **Lightweight, no dependencies**

---

## Features

- Universal: Works in Node.js (18+), browsers, and modern runtimes
- Static methods: `get`, `post`, `patch`, `delete`, and `request`
- Response and error objects with useful metadata
- Full TypeScript typings
- ESM, CJS, and UMD (browser) builds
- **Instance configuration**: Create custom HttpClient instances with default `baseURL`, headers, and other options using `HttpClient.create()`. Each instance can have its own defaults, and per-request options override instance and global settings.
- **Static and instance methods**: All HTTP methods (`get`, `post`, `patch`, `delete`, `request`) are available as both static and instance methods for maximum flexibility.

---

## Installation

```
npm install advance-http-client
```

Or clone and build locally:

```
git clone <repo-url>
cd advance-http-client
npm install
npm run build
```

---

## Usage

### Node.js (18+)

```js
import HttpClient from "./dist/esm/index.js";

async function main() {
  try {
    const response = await HttpClient.get(
      "https://jsonplaceholder.typicode.com/todos/1"
    );
    console.log("Fetched data:", response.data);
    console.log("Status:", response.status);
    console.log("Headers:", response.headers);
  } catch (err) {
    if (err && err.response) {
      console.error(
        "HTTP Error:",
        err.response.status,
        err.response.statusText
      );
      console.error("Response data:", err.response.data);
      console.error("Headers:", err.response.headers);
    } else {
      console.error("Error:", err);
    }
  }
}

main();
```

### Browser (UMD)

```html
<script src="./dist/browser/http-client.js"></script>
<script>
  HttpClient.get("https://jsonplaceholder.typicode.com/todos/1")
    .then((response) => {
      console.log("Fetched data:", response.data);
    })
    .catch((err) => {
      if (err && err.response) {
        console.error("HTTP Error:", err.response.status);
      } else {
        console.error("Error:", err);
      }
    });
</script>
```

### API

All methods return a Promise that resolves to a response object or rejects with an error containing a `.response` property:

```ts
interface HttpClientResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: {
    url: string;
    options?: RequestInit;
    method: string;
    body?: any;
  };
  request: Response;
}
```

#### Methods

- `HttpClient.get(url, options?)`
- `HttpClient.post(url, body?, options?)`
- `HttpClient.patch(url, body?, options?)`
- `HttpClient.delete(url, options?)`
- `HttpClient.request(url, options?)`

#### Error Handling

All non-2xx/3xx responses throw an error with a `.response` property:

```js
try {
  await HttpClient.get("/notfound");
} catch (err) {
  if (err && err.response) {
    console.error(err.response.status); // e.g. 404
  }
}
```

---

### Creating an Instance

You can create a custom HttpClient instance with its own default configuration using `HttpClient.create()`. This allows you to set a `baseURL`, default headers, and other options for that instance. Per-request options always override instance and global defaults.

```js
const api = HttpClient.create({
  baseURL: "https://api.example.com",
  headers: { Authorization: "Bearer token" },
});

// Uses baseURL and default headers
api.get("/users"); // GET https://api.example.com/users

// Per-request headers override instance/global headers
api.get("/users", { headers: { Authorization: "Other token" } });
```

### Custom Request Isolation

You can run a request completely isolated from all global, instance, and default settings by passing the `isolated: true` option. When this is set, only the options you provide for that request are used—no global headers, no baseURL, and no defaults are applied.

**Example:**

```js
// This request will NOT use any global headers, instance config, or defaults
HttpClient.post(
  "https://jsonplaceholder.typicode.com/posts",
  {
    title: "foo",
    body: "bar",
    userId: 1,
  },
  { isolated: true }
);
```

This is useful for advanced scenarios where you need a request to be fully independent of any shared configuration.

### Isolated Requests with `includeHeaders`

You can use the `includeHeaders` option (array of header names) with `isolated: true` to selectively include specific headers from global or instance headers in an otherwise isolated request. This is useful for sending only a subset of default headers in a secure, controlled way.

**Example:**

```js
// Set global and instance headers
HttpClient.setHeader("ApiKey", "MY_API_KEY");
const http = HttpClient.create({
  baseURL: "https://api.example.com",
  headers: { "X-Global": "global-header" },
});

// Isolated request, but include only 'ApiKey' and 'X-Global' if present
http.get("/resource", {
  isolated: true,
  includeHeaders: ["ApiKey", "X-Global"],
  headers: { Authorization: "123" }, // Per-request headers still override
});
```

- If `isolated: true` and `includeHeaders` is set, only the specified headers (if present in global or instance headers) are included, plus any headers you provide directly in the request.
- If `isolated: true` and `includeHeaders` is not set, only the headers you provide in the request are sent.

See also: [Security Notes](#security-notes)

---

## Important Notes

- **Default Accept Header:** All requests include an `Accept: application/json` header by default unless you override it. This ensures consistent JSON parsing for most APIs.
- **Content-Type Handling:** For `post`, `patch`, and `delete` methods, the `Content-Type: application/json` header is only set if you do not provide your own. This allows sending custom payloads (e.g., `FormData`, `Blob`).
- **DELETE with Body:** The `delete` method supports an optional request body, which is stringified as JSON by default if provided.
- **UMD/Browser Usage:** In browser environments, the library is available as the global `HttpClient` (e.g., `window.HttpClient`).
- **Node.js Compatibility:** For Node.js versions <18, you must polyfill `fetch` (e.g., with `node-fetch`).

---

## Building

```
npm run build
```

- ESM output: `dist/esm/`
- CJS output: `dist/cjs/`
- UMD (browser): `dist/browser/http-client.js`

---

## Testing

```
npm run test
```

Runs Jest tests in `src/index.test.ts`.

---

## Security Note

- Do not hardcode sensitive credentials (e.g., Authorization tokens, API keys) in client-side/browser code.
- Global headers set with setHeader are sent with every request unless overridden. Use per-request headers for sensitive data when possible.
- Always validate and sanitize any dynamic URLs or user input passed to request methods to avoid SSRF or open redirect risks.
- This library has no known vulnerabilities and no dependencies, but always keep your environment and polyfills up to date.

---

## License

MIT
