# Test Coverage Notes for advance-http-client

This document summarizes the test coverage provided by the Jest test suite (`src/index.test.ts`).

## Covered Cases

### Static API (HttpClient static methods)

- **GET**: Returns data and correct status.
- **POST**: Returns created data and correct status.
- **PATCH**: Updates data and returns correct status.
- **DELETE**: Returns a successful status.
- **Error handling**: Throws for non-2xx responses (404, 500, 400) and exposes `.response` property.
- **Global headers**: `HttpClient.setHeader` sets headers sent with requests.

### Instance API (HttpClient.create())

- **GET**: Returns data and correct status.
- **POST**: Returns created data and correct status.
- **PATCH**: Updates data and returns correct status.
- **DELETE**: Returns a successful status.
- **Header precedence**: Per-request headers override instance/global headers.
- **baseURL logic**: Does not prepend baseURL for absolute URLs.
- **DELETE with body**: Supported and tested.

## Not Covered / Not Implemented

- Instance `.setHeader` (intentionally removed for security).
- Timeout, interceptors, or retry logic (not implemented).

## Summary

The test suite comprehensively covers all major features, error handling, header logic, and both static and instance usage. All critical behaviors are validated for reliability and security.
