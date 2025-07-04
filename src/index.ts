// Define proper types for extended options
export interface ExtendedRequestInit extends RequestInit {
  isolated?: boolean;
  includeHeaders?: string[];
  /**
   * Request timeout in milliseconds. If the request does not complete within this time it will be aborted.
   */
  timeout?: number;
  /**
   * Unique key that can later be used to cancel this request via cancelRequest.
   */
  controlKey?: string;
}

// Define proper error type
export interface HttpClientError extends Error {
  response: HttpClientResponse;
}

export interface HttpClientResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: {
    url: string;
    options?: RequestInit;
    method: string;
    body?: unknown;
  };
  request: Response;
}

export interface HttpRequestOptions extends Omit<RequestInit, "headers"> {
  /**
   * Headers as a plain object. This is always a Record<string, string> in this implementation.
   */
  headers: Record<string, string>;
  /**
   * If true, this request will ignore all global, instance, and default settings, using only the provided options.
   */
  isolated?: boolean;
  /**
   * If set, and isolated is true, these header names will be included from global/instance headers if present.
   */
  includeHeaders?: string[];
  /**
   * Request timeout in milliseconds. If the request does not complete within this time it will be aborted.
   */
  timeout?: number;
  /**
   * Unique key that can later be used to cancel this request via cancelRequest.
   */
  controlKey?: string;
}

export interface HttpClientConfig extends Omit<RequestInit, "headers"> {
  baseURL?: string;
  headers?: Record<string, string>;
  timeout?: number;
  /**
   * Default cancellation key applied to every request made by this instance (optional)
   */
  controlKey?: string;
}

// Interceptor types
export interface RequestInterceptor {
  (_config: HttpRequestOptions): HttpRequestOptions | Promise<HttpRequestOptions>;
}

export interface ResponseInterceptor<T = unknown> {
  (_response: HttpClientResponse<T>): HttpClientResponse<T> | Promise<HttpClientResponse<T>>;
}

export interface ErrorInterceptor {
  (_error: HttpClientError): HttpClientError | Promise<HttpClientError> | Promise<never>;
}

interface InterceptorHandler<T> {
  _fulfilled?: T;
  _rejected?: T;
}

export interface InterceptorManager<T> {
  use(_fulfilled?: T, _rejected?: T): number;
  eject(_id: number): void;
  clear(): void;
  handlers: InterceptorHandler<T>[];
}

class InterceptorManagerImpl<T> implements InterceptorManager<T> {
  private _handlers: InterceptorHandler<T>[] = [];
  private nextId = 0;

  use(_fulfilled?: T, _rejected?: T): number {
    this._handlers.push({
      _fulfilled,
      _rejected,
    });
    return this.nextId++;
  }

  eject(_id: number): void {
    if (this._handlers[_id]) {
      this._handlers[_id] = {};
    }
  }

  clear(): void {
    this._handlers = [];
  }

  get handlers(): InterceptorHandler<T>[] {
    return this._handlers;
  }
}

// Separate error interceptor manager
class ErrorInterceptorManagerImpl implements InterceptorManager<ErrorInterceptor> {
  private _handlers: InterceptorHandler<ErrorInterceptor>[] = [];
  private nextId = 0;

  use(_fulfilled?: ErrorInterceptor, _rejected?: ErrorInterceptor): number {
    this._handlers.push({
      _fulfilled,
      _rejected,
    });
    return this.nextId++;
  }

  eject(_id: number): void {
    if (this._handlers[_id]) {
      this._handlers[_id] = {};
    }
  }

  clear(): void {
    this._handlers = [];
  }

  get handlers(): InterceptorHandler<ErrorInterceptor>[] {
    return this._handlers;
  }
}

// Constants for content types
const CONTENT_TYPES = {
  JSON: "application/json",
  TEXT: "text/",
  FORM: "form",
  BLOB: "blob",
  ARRAY_BUFFER: "arraybuffer",
} as const;

// Constants for HTTP methods
const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PATCH: "PATCH",
  DELETE: "DELETE",
} as const;

// Special key used internally for requests that don't specify a controlKey
const ANONYMOUS_KEY = "__anonymous__";

export class HttpClient {
  private static globalHeaders: Record<string, string> = {};
  private static globalControllers = new Map<string, AbortController>();
  private static allInstances = new Set<HttpClient>();
  private readonly baseURL?: string;
  private readonly instanceHeaders: Record<string, string>;
  private readonly instanceOptions: Omit<RequestInit, "headers">;
  
  // Interceptor properties
  public interceptors: {
    request: InterceptorManager<RequestInterceptor>;
    response: InterceptorManager<ResponseInterceptor>;
    error: InterceptorManager<ErrorInterceptor>;
  };

  private controllers = new Map<string, AbortController>();

  constructor(config?: HttpClientConfig) {
    this.baseURL = config?.baseURL;
    this.instanceHeaders = { ...(config?.headers || {}) };
    const { baseURL: _baseURL, headers: _headers, ...rest } = config || {};
    this.instanceOptions = rest;
    
    // Initialize interceptors
    this.interceptors = {
      request: new InterceptorManagerImpl<RequestInterceptor>(),
      response: new InterceptorManagerImpl<ResponseInterceptor>(),
      error: new ErrorInterceptorManagerImpl(),
    };
    
    // Track instance for global cancellation capability
    HttpClient.allInstances.add(this);
  }

  /**
   * Set a global header for all requests (e.g., for authorization).
   */
  static setHeader(key: string, value: string): void {
    this.globalHeaders[key] = value;
  }

  /**
   * Generate a random 20-character alphanumeric string suitable for use as a controlKey.
   */
  static generateControlKey(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const bytes = new Uint8Array(20);

    const gCrypto: Crypto | undefined = (globalThis as any).crypto;
    if (gCrypto && typeof gCrypto.getRandomValues === "function") {
      gCrypto.getRandomValues(bytes);
    } else {
      // Try Node.js crypto as a fallback (works in CJS & ESM)
      const nodeCrypto = (globalThis as any).require?.("crypto");
      if (nodeCrypto && typeof nodeCrypto.randomBytes === "function") {
        const buf: Uint8Array = nodeCrypto.randomBytes(20);
        buf.forEach((b: number, i: number) => (bytes[i] = b));
      } else {
        throw new Error("Secure random number generation is not available in this environment. Please provide a controlKey manually.");
      }
    }

    let result = "";
    bytes.forEach((b) => {
      result += chars[b % chars.length];
    });
    return result;
  }

  /**
   * Create a new HttpClient instance with custom default configuration.
   * @param config - Default configuration for this instance (e.g., baseURL, headers, credentials, etc.)
   * @returns A new HttpClient instance with the provided defaults.
   *
   * Example:
   * ```js
   * const api = HttpClient.create({
   *   baseURL: 'https://api.example.com',
   *   headers: { Authorization: 'Bearer token' }
   * });
   * api.get('/users'); // GET https://api.example.com/users
   * ```
   */
  static create(config?: HttpClientConfig): HttpClient {
    return new HttpClient(config);
  }

  private static async parseResponseBody(response: Response): Promise<unknown> {
    let data: unknown = undefined;
    const contentType: string = response.headers.get("content-type") ?? "";
    
    if (contentType && contentType.indexOf(CONTENT_TYPES.JSON) !== -1) {
      data = await response.json();
    } else if (contentType && contentType.indexOf(CONTENT_TYPES.TEXT) !== -1) {
      data = await response.text();
    } else if (contentType && contentType.indexOf(CONTENT_TYPES.FORM) !== -1) {
      data = await response.formData();
    } else if (contentType && contentType.indexOf(CONTENT_TYPES.BLOB) !== -1) {
      data = await response.blob();
    } else if (contentType && contentType.indexOf(CONTENT_TYPES.ARRAY_BUFFER) !== -1) {
      data = await response.arrayBuffer();
    } else {
      data = await response.text();
    }
    return data;
  }

  private mergeConfig(options?: ExtendedRequestInit): HttpRequestOptions {
    if (options?.isolated) {
      const headers: Record<string, string> = {};
      
      // If includeHeaders is set, pull those from global/instance headers
      if (Array.isArray(options.includeHeaders)) {
        const include = options.includeHeaders;
        // Pull from instanceHeaders first, then globalHeaders
        for (const key of include) {
          if (this.instanceHeaders?.[key] !== undefined) {
            headers[key] = this.instanceHeaders[key];
          } else if (HttpClient.globalHeaders[key] !== undefined) {
            headers[key] = HttpClient.globalHeaders[key];
          }
        }
      }
      
      // Merge in provided headers (overrides included ones)
      if (options.headers) {
        if (options.headers instanceof Headers) {
          options.headers.forEach((v, k) => (headers[k] = v));
        } else if (Array.isArray(options.headers)) {
          options.headers.forEach(([k, v]) => (headers[k] = v));
        } else {
          Object.assign(headers, options.headers);
        }
      }
      
      return {
        ...options,
        headers,
      };
    }
    
    // Merge instance headers, global headers, and per-request headers
    const mergedHeaders: Record<string, string> = {
      ...this.instanceHeaders,
      ...(options?.headers instanceof Headers
        ? this.convertHeadersToObject(options.headers)
        : (options?.headers as Record<string, string>) || {}),
    };
    
    // Merge global headers after user headers, so user headers take precedence
    Object.entries(HttpClient.globalHeaders).forEach(([k, v]) => {
      if (!(k in mergedHeaders)) mergedHeaders[k] = v;
    });
    
    // Set default Accept header if not already set
    if (!mergedHeaders["Accept"]) {
      mergedHeaders["Accept"] = CONTENT_TYPES.JSON;
    }
    
    return {
      ...this.instanceOptions,
      ...options,
      headers: mergedHeaders,
    };
  }

  private convertHeadersToObject(headers: Headers): Record<string, string> {
    const obj: Record<string, string> = {};
    headers.forEach((v, k) => {
      obj[k] = v;
    });
    return obj;
  }

  private buildURL(url: string): string {
    if (this.baseURL && !/^https?:\/\//i.test(url)) {
      return this.baseURL.replace(/\/$/, "") + "/" + url.replace(/^\//, "");
    }
    return url;
  }

  private async executeRequestInterceptors(config: HttpRequestOptions): Promise<HttpRequestOptions> {
    let promise: Promise<HttpRequestOptions> = Promise.resolve(config);
    const chain = this.interceptors.request.handlers;
    for (const { _fulfilled, _rejected } of chain) {
      promise = promise.then(
        _fulfilled ? _fulfilled : (_c) => _c,
        _rejected ? _rejected : (_e) => Promise.reject(_e)
      );
    }
    return promise;
  }

  private async executeResponseInterceptors<T>(response: HttpClientResponse<T>): Promise<HttpClientResponse<T>> {
    let promise: Promise<HttpClientResponse<T>> = Promise.resolve(response);
    const chain = this.interceptors.response.handlers;
    for (const { _fulfilled, _rejected } of chain) {
      promise = promise.then(
        _fulfilled ? (_fulfilled as (_r: HttpClientResponse<T>) => HttpClientResponse<T> | Promise<HttpClientResponse<T>>) : (_r) => _r,
        _rejected ? (_rejected as (_e: any) => any) : (_e) => Promise.reject(_e)
      );
    }
    return promise;
  }

  private async executeErrorInterceptors(error: HttpClientError): Promise<never> {
    let currentError = error;
    
    // Execute error interceptors
    for (const interceptor of this.interceptors.error.handlers) {
      if (interceptor._fulfilled) {
        try {
          const result = await interceptor._fulfilled(currentError);
          // If the interceptor returns a response, it means the error was handled
          if (result && typeof result === 'object' && 'data' in result && 'status' in result) {
            return result as never;
          }
          // If it returns an error, continue the chain
          if (result && typeof result === 'object' && 'message' in result) {
            currentError = result as HttpClientError;
          }
        } catch (interceptorError) {
          currentError = interceptorError as HttpClientError;
        }
      }
    }
    
    throw currentError;
  }

  async request<T = unknown>(
    url: string,
    options?: RequestInit
  ): Promise<HttpClientResponse<T>> {
    if (typeof fetch === "undefined") {
      throw new Error(
        "fetch is not available in this environment. For Node.js <18, install a fetch polyfill."
      );
    }
    
    const finalOptions = this.mergeConfig(options as ExtendedRequestInit);
    const fullUrl = this.buildURL(url);
    
    // Execute request interceptors
    const interceptedOptions = await this.executeRequestInterceptors(finalOptions);
    
    // Determine if we have to create an AbortController (for timeout or controlKey)
    const needsController = (!interceptedOptions.signal) || (typeof interceptedOptions.timeout === "number" && interceptedOptions.timeout > 0) || interceptedOptions.controlKey;

    let timeoutId: ReturnType<typeof globalThis.setTimeout> | undefined;
    let controller: AbortController | undefined;
    let currentControlKey: string | undefined = interceptedOptions.controlKey;

    if (needsController) {
      if (!interceptedOptions.signal) {
        controller = new AbortController();
        interceptedOptions.signal = controller.signal;
      }
    }

    if (typeof interceptedOptions.timeout === "number" && interceptedOptions.timeout > 0) {
      // If a signal already exists, we cannot attach our AbortController.
      timeoutId = globalThis.setTimeout(() => {
        controller?.abort();
      }, interceptedOptions.timeout);
      // timeout should not be passed to fetch API
      delete (interceptedOptions as any).timeout;
    }

    // Handle controlKey registration (no duplicates)
    if (currentControlKey) {
      const key = currentControlKey;
      delete (interceptedOptions as any).controlKey;
      let map: Map<string, AbortController>;
      if ((this as any)._isStaticInstance) {
        map = HttpClient.globalControllers;
      } else {
        map = this.controllers;
      }
      if (map.has(key)) {
        throw new Error(`controlKey '${key}' is already in use.`);
      }
      if (!controller) {
        controller = new AbortController();
        interceptedOptions.signal = controller.signal;
      }
      map.set(key, controller);
    }

    // Handle requests without a controlKey by using a shared anonymous key
    if (!currentControlKey) {
      const mapAnon: Map<string, AbortController> = (this as any)._isStaticInstance ? HttpClient.globalControllers : this.controllers;
      const existingCtrl = mapAnon.get(ANONYMOUS_KEY);
      if (existingCtrl) {
        // Reuse existing controller
        interceptedOptions.signal = existingCtrl.signal;
        controller = existingCtrl;
      } else {
        if (!controller) {
          controller = new AbortController();
          interceptedOptions.signal = controller.signal;
        }
        mapAnon.set(ANONYMOUS_KEY, controller);
      }
    }

    try {
      const response = await fetch(fullUrl, interceptedOptions);
      if (timeoutId) globalThis.clearTimeout(timeoutId);
      // Remove controlKey mapping after completion
      if (currentControlKey) {
        const map = this.controllers.has(currentControlKey) ? this.controllers : HttpClient.globalControllers;
        map.delete(currentControlKey);
      }
      const data = await HttpClient.parseResponseBody(response);
      const headers: Record<string, string> = {};
      
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      
      const result: HttpClientResponse<T> = {
        data: data as T,
        status: response.status,
        statusText: response.statusText,
        headers,
        config: {
          url: fullUrl,
          options: interceptedOptions,
          method: interceptedOptions?.method ?? HTTP_METHODS.GET,
          body: interceptedOptions?.body,
        },
        request: response,
      };
      
      if (!response.ok) {
        const error = new Error(
          `Request failed with status code ${response.status}`
        ) as HttpClientError;
        error.response = result;
        throw error;
      }
      
      // Execute response interceptors
      return await this.executeResponseInterceptors(result);
    } catch (error) {
      // Ensure we clean up controllers even on error
      if (currentControlKey) {
        const map = this.controllers.has(currentControlKey) ? this.controllers : HttpClient.globalControllers;
        map.delete(currentControlKey);
      }
      // Execute error interceptors
      return await this.executeErrorInterceptors(error as HttpClientError);
    }
  }

  async get<T = unknown>(
    url: string,
    options?: RequestInit
  ): Promise<HttpClientResponse<T>> {
    return this.request<T>(url, { ...options, method: HTTP_METHODS.GET });
  }

  private async requestWithBody<T = unknown>(
    method: string,
    url: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<HttpClientResponse<T>> {
    const opts = this.mergeConfig(options as ExtendedRequestInit);
    opts.method = method;
    
    if (body !== undefined) {
      opts.body = JSON.stringify(body);
      if (!opts.headers["Content-Type"]) {
        opts.headers["Content-Type"] = CONTENT_TYPES.JSON;
      }
    }
    
    return this.request<T>(url, opts);
  }

  async post<T = unknown>(
    url: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<HttpClientResponse<T>> {
    return this.requestWithBody<T>(HTTP_METHODS.POST, url, body, options);
  }

  async patch<T = unknown>(
    url: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<HttpClientResponse<T>> {
    return this.requestWithBody<T>(HTTP_METHODS.PATCH, url, body, options);
  }

  async delete<T = unknown>(
    url: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<HttpClientResponse<T>> {
    return this.requestWithBody<T>(HTTP_METHODS.DELETE, url, body, options);
  }

  // Internal helper to abort controllers for cleanup
  private _abortAllControllers() {
    this.controllers.forEach((c) => c.abort());
    this.controllers.clear();
  }

  // ---------------------------------------------------------------------------
  // Static helper methods (backward compatibility)
  // These create a temporary client marked as a "static" instance so that any
  // controlKey registered will be placed in the globalControllers map. After
  // completion, users can cancel with HttpClient.cancelRequest / cancelAllRequests.
  // ---------------------------------------------------------------------------
  static async get<T = unknown>(
    url: string,
    options?: RequestInit
  ): Promise<HttpClientResponse<T>> {
    const client = new HttpClient();
    (client as any)._isStaticInstance = true;
    return client.get<T>(url, options);
  }

  static async post<T = unknown>(
    url: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<HttpClientResponse<T>> {
    const client = new HttpClient();
    (client as any)._isStaticInstance = true;
    return client.post<T>(url, body, options);
  }

  static async patch<T = unknown>(
    url: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<HttpClientResponse<T>> {
    const client = new HttpClient();
    (client as any)._isStaticInstance = true;
    return client.patch<T>(url, body, options);
  }

  static async delete<T = unknown>(
    url: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<HttpClientResponse<T>> {
    const client = new HttpClient();
    (client as any)._isStaticInstance = true;
    return client.delete<T>(url, body, options);
  }

  static cancelRequest(controlKey: string): void {
    // First look in global map
    const ctrl = HttpClient.globalControllers.get(controlKey);
    if (ctrl) {
      ctrl.abort();
      HttpClient.globalControllers.delete(controlKey);
      return;
    }

    // Otherwise, search all instances
    for (const inst of HttpClient.allInstances) {
      const c = inst.controllers.get(controlKey);
      if (c) {
        c.abort();
        inst.controllers.delete(controlKey);
        break;
      }
    }
  }

  static cancelAllRequests(): void {
    // Abort global controllers
    HttpClient.globalControllers.forEach((c) => c.abort());
    HttpClient.globalControllers.clear();

    // Abort controllers in every instance
    for (const inst of HttpClient.allInstances) {
      inst._abortAllControllers();
    }
  }
}

// Keep static default for backward compatibility
export default HttpClient;
