# http-client

Universal HTTP client library using fetch for JS/TS projects (React, Next.js, Vue, Node.js, Bun, etc.)

## Features
- Universal: Works in browsers and modern runtimes (Node.js 18+, Bun, Deno, etc.)
- TypeScript & JavaScript support
- ESM & CommonJS output
- Lightweight, no dependencies (uses native fetch)

## Usage

```js
import { httpRequest } from 'http-client';

httpRequest('https://api.example.com/data')
  .then(response => response.json())
  .then(data => console.log(data));
```

## Node.js Support
- Node.js 18+ has native fetch. For older versions, use a polyfill like `node-fetch` or `undici`.

## Build

```bash
npm run build
```

## License
MIT
