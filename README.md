# advanced-http-client
[![npm](https://img.shields.io/npm/v/advanced-http-client.svg)](https://www.npmjs.com/package/advanced-http-client)

A universal, modern HTTP client library using `fetch` for JavaScript and TypeScript projects. Works seamlessly in Node.js (v18+), browsers, and modern JS runtimes/frameworks (React, Next.js, Vue, Bun, etc.).

- **ESM, CJS, and UMD builds**
- **TypeScript support**
- **Flexible API and error handling**
- **Lightweight, no dependencies**

---

## 🚀 Demo

[🔗 Live Demo](https://sandeep2007.github.io/advanced-http-client/example.html)

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

```bash
npm install advanced-http-client
```

### Node.js Requirements

- **Node.js 18+**: Built-in `fetch` support
- **Node.js <18**: Install a fetch polyfill like `node-fetch` or `undici`

```bash
# For Node.js <18
npm install node-fetch
```

### Framework Support

- **React/Next.js**: Works out of the box
- **Vue.js**: Works out of the box  
- **Vanilla JS**: Works in modern browsers
- **Bun**: Works out of the box
- **Deno**: Works out of the box

Or clone and build locally:

```bash
git clone https://github.com/sandeep2007/advanced-http-client.git
cd advanced-http-client
npm install
npm run build
```

---

## Development Setup

### Prerequisites

- Node.js 18+ (for built-in fetch support)
- npm or yarn

### Local Development

```bash
# Clone the repository
git clone https://github.com/sandeep2007/advanced-http-client.git
cd advanced-http-client

# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check

# Build all targets
npm run build

# Run complete CI pipeline
npm run ci
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm test` | Run Jest tests |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage:watch` | Run tests with coverage in watch mode |
| `npm run lint` | Run ESLint on source files |
| `npm run lint:fix` | Fix ESLint issues automatically |
| `npm run type-check` | Run TypeScript type checking |
| `npm run build` | Build all targets (ESM, CJS, Browser) |
| `npm run build:esm` | Build ESM version only |
| `npm run build:cjs` | Build CommonJS version only |
| `npm run build:web` | Build browser/UMD version only |
| `npm run clean` | Clean build artifacts |
| `npm run ci` | Run complete CI pipeline (lint + type-check + test + build) |
| `npm run generate:coverage-report` | Generate detailed coverage report |

### Project Structure

```
advanced-http-client/
├── src/
│   ├── index.ts          # Main source code
│   └── index.test.ts     # Test suite
├── dist/                 # Build outputs
│   ├── esm/             # ES modules
│   ├── cjs/             # CommonJS
│   └── browser/         # UMD bundle
├── scripts/             # Build and utility scripts
├── coverage/            # Test coverage reports (generated)
└── docs/               # Documentation (if any)
```

---

## Usage

### Node.js (18+)

```js
import HttpClient from "advanced-http-client";

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
<script src="https://unpkg.com/advanced-http-client/dist/browser/http-client.js"></script>
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

### Request Timeout (AbortController)

`advanced-http-client` supports configurable timeouts using the browser / Node `AbortController`.

• **Per-request** – pass `timeout` (milliseconds) in the options object.
• **Instance default** – set `timeout` in `HttpClient.create()` so every call on that instance inherits the limit.

If the timer elapses before the server responds the underlying `fetch` call is aborted and the returned promise rejects with an `AbortError` (or the platform-specific error message).

```ts
// Per-request timeout (2 s)
await HttpClient.get('https://httpbin.org/delay/5', { timeout: 2000 });

// Instance-level default timeout
const apiTimeout = HttpClient.create({ baseURL: 'https://httpbin.org', timeout: 2000 });
await apiTimeout.post('/delay/5', { foo: 'bar' });
```

> **Note** If you also supply a custom `AbortSignal` in the request options, `HttpClient` will respect it and not override your signal.

---

### Runtime Cancellation (controlKey)

`advanced-http-client` lets you abort in-flight requests at any moment:

1. Provide a `controlKey` when you initiate a request – a unique string that identifies that call.
2. Later call `HttpClient.cancelRequest(key)` or `HttpClient.cancelAllRequests()` to abort it (or every request).

```ts
// Generate a cryptographically-strong 20-char key
const key = HttpClient.generateControlKey();

// Start a request with this key
const pending = HttpClient.get('https://httpbin.org/delay/5', { controlKey: key });

// …at some later time
HttpClient.cancelRequest(key); // promise rejects with AbortError
```

#### Anonymous requests

If you **omit** `controlKey`, the library still tracks the call internally under a shared key `"__anonymous__"`.  That means:

* You can have only **one** anonymous request active at a time – a second one will automatically reuse the same abort controller.
* Call `HttpClient.cancelRequest('__anonymous__')` _or_ `HttpClient.cancelAllRequests()` to abort it.
* Explicit keys are still checked for duplicates – trying to reuse an existing key throws an error so you don't cancel the wrong request inadvertently.

```ts
// Start anonymous request
HttpClient.get('https://httpbin.org/delay/5');

// Abort all anonymous & keyed requests
HttpClient.cancelAllRequests();
```

> **Tip**   Use `HttpClient.generateControlKey()` whenever you need a guaranteed-unique key.

---

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

## Migration Guide

### From fetch

```javascript
// Native fetch
const response = await fetch('/api/data');
const data = await response.json();

// advanced-http-client
const response = await HttpClient.get('/api/data');
const data = response.data; // Already parsed
```
