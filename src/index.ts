export interface HttpClientResponse<T = any> {
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

export interface HttpRequestOptions extends Omit<RequestInit, "headers"> {
  /**
   * Headers as a plain object. This is always a Record<string, string> in this implementation.
   */
  headers: Record<string, string>;
  /**
   * If true, this request will ignore all global, instance, and default settings, using only the provided options.
   */
  isolated?: boolean;
}

export interface HttpClientConfig extends Omit<RequestInit, "headers"> {
  baseURL?: string;
  headers?: Record<string, string>;
}

export class HttpClient {
  private static globalHeaders: Record<string, string> = {};
  private readonly baseURL?: string;
  private readonly instanceHeaders: Record<string, string>;
  private readonly instanceOptions: Omit<RequestInit, "headers">;

  constructor(config?: HttpClientConfig) {
    this.baseURL = config?.baseURL;
    this.instanceHeaders = { ...(config?.headers || {}) };
    const { baseURL: _baseURL, headers: _headers, ...rest } = config || {};
    this.instanceOptions = rest;
  }

  /**
   * Set a global header for all requests (e.g., for authorization).
   */
  static setHeader(key: string, value: string) {
    this.globalHeaders[key] = value;
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
  static create(config?: HttpClientConfig) {
    return new HttpClient(config);
  }

  private static async parseResponseBody(response: Response): Promise<any> {
    let data: any = undefined;
    const contentType: string = response.headers.get("content-type") ?? "";
    if (contentType && contentType.indexOf("application/json") !== -1) {
      data = await response.json();
    } else if (contentType && contentType.indexOf("text/") !== -1) {
      data = await response.text();
    } else if (contentType && contentType.indexOf("form") !== -1) {
      data = await response.formData();
    } else if (contentType && contentType.indexOf("blob") !== -1) {
      data = await response.blob();
    } else if (contentType && contentType.indexOf("arraybuffer") !== -1) {
      data = await response.arrayBuffer();
    } else {
      data = await response.text();
    }
    return data;
  }

  private mergeConfig(
    options?: RequestInit & { isolated?: boolean }
  ): HttpRequestOptions {
    if (options && (options as any).isolated) {
      // Only use the provided options, do not merge any global, instance, or default settings
      const headers: Record<string, string> = {};
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
        ? (() => {
            const obj: Record<string, string> = {};
            options.headers.forEach((v, k) => {
              obj[k] = v;
            });
            return obj;
          })()
        : (options?.headers as Record<string, string>) || {}),
    };
    // Merge global headers after user headers, so user headers take precedence
    Object.entries(HttpClient.globalHeaders).forEach(([k, v]) => {
      if (!(k in mergedHeaders)) mergedHeaders[k] = v;
    });
    // Set default Accept header if not already set
    if (!mergedHeaders["Accept"]) {
      mergedHeaders["Accept"] = "application/json";
    }
    return {
      ...this.instanceOptions,
      ...options,
      headers: mergedHeaders,
    };
  }

  private buildURL(url: string): string {
    if (this.baseURL && !/^https?:\/\//i.test(url)) {
      return this.baseURL.replace(/\/$/, "") + "/" + url.replace(/^\//, "");
    }
    return url;
  }

  async request<T = any>(
    url: string,
    options?: RequestInit
  ): Promise<HttpClientResponse<T>> {
    if (typeof fetch === "undefined") {
      throw new Error(
        "fetch is not available in this environment. For Node.js <18, install a fetch polyfill."
      );
    }
    const finalOptions = this.mergeConfig(options);
    const fullUrl = this.buildURL(url);
    const response = await fetch(fullUrl, finalOptions);
    let data: any = await HttpClient.parseResponseBody(response);
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    const result: HttpClientResponse<T> = {
      data,
      status: response.status,
      statusText: response.statusText,
      headers,
      config: {
        url: fullUrl,
        options: finalOptions,
        method: finalOptions?.method ?? "GET",
        body: finalOptions?.body,
      },
      request: response,
    };
    if (!response.ok) {
      const error: any = new Error(
        `Request failed with status code ${response.status}`
      );
      error.response = result;
      throw error;
    }
    return result;
  }

  async get<T = any>(
    url: string,
    options?: RequestInit
  ): Promise<HttpClientResponse<T>> {
    return this.request<T>(url, { ...options, method: "GET" });
  }

  async post<T = any>(
    url: string,
    body?: any,
    options?: RequestInit
  ): Promise<HttpClientResponse<T>> {
    const opts = this.mergeConfig(options);
    opts.method = "POST";
    opts.body = body ? JSON.stringify(body) : undefined;
    if (!opts.headers["Content-Type"]) {
      opts.headers["Content-Type"] = "application/json";
    }
    return this.request<T>(url, opts);
  }

  async patch<T = any>(
    url: string,
    body?: any,
    options?: RequestInit
  ): Promise<HttpClientResponse<T>> {
    const opts = this.mergeConfig(options);
    opts.method = "PATCH";
    opts.body = body ? JSON.stringify(body) : undefined;
    if (!opts.headers["Content-Type"]) {
      opts.headers["Content-Type"] = "application/json";
    }
    return this.request<T>(url, opts);
  }

  async delete<T = any>(
    url: string,
    body?: any,
    options?: RequestInit
  ): Promise<HttpClientResponse<T>> {
    const opts = this.mergeConfig(options);
    opts.method = "DELETE";
    if (body !== undefined) {
      opts.body = JSON.stringify(body);
      if (!opts.headers["Content-Type"]) {
        opts.headers["Content-Type"] = "application/json";
      }
    }
    return this.request<T>(url, opts);
  }

  // Add static methods for backward compatibility
  static async get<T = any>(
    url: string,
    options?: RequestInit
  ): Promise<HttpClientResponse<T>> {
    return new HttpClient().get<T>(url, options);
  }

  static async post<T = any>(
    url: string,
    body?: any,
    options?: RequestInit
  ): Promise<HttpClientResponse<T>> {
    return new HttpClient().post<T>(url, body, options);
  }

  static async patch<T = any>(
    url: string,
    body?: any,
    options?: RequestInit
  ): Promise<HttpClientResponse<T>> {
    return new HttpClient().patch<T>(url, body, options);
  }

  static async delete<T = any>(
    url: string,
    body?: any,
    options?: RequestInit
  ): Promise<HttpClientResponse<T>> {
    return new HttpClient().delete<T>(url, body, options);
  }
}

// Keep static default for backward compatibility
export default HttpClient;
