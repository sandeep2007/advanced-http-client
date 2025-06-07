# advance-http-client

A universal, Axios-style HTTP client library using `fetch` for JavaScript and TypeScript projects. Works seamlessly in Node.js (18+), browsers, and modern JS runtimes/frameworks (React, Next.js, Vue, Bun, etc.).

- **ESM, CJS, and UMD builds**
- **TypeScript support**
- **Axios-style API and error handling**
- **Lightweight, no dependencies**

---

## Features

- Universal: Works in Node.js (18+), browsers, and modern runtimes
- Static methods: `get`, `post`, `patch`, `delete`, and `request`
- Axios-style response and error objects
- Full TypeScript typings
- ESM, CJS, and UMD (browser) builds

---

## Installation

```
npm install http-client
```

Or clone and build locally:

```
git clone <repo-url>
cd http-client
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

All methods return a Promise that resolves to an Axios-style response object or rejects with an error containing a `.response` property:

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

All non-2xx/3xx responses throw an error with an Axios-style `.response` property:

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

## License

MIT
