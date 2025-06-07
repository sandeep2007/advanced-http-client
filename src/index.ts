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
  setHeader: (key: string, value: string) => void;
}

function createHttpRequestOptions(
  options?: RequestInit,
  globalHeaders?: Record<string, string>
): HttpRequestOptions {
  const headers: Record<string, string> = {};
  if (options?.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((v, k) => (headers[k] = v));
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([k, v]) => (headers[k] = v));
    } else {
      Object.assign(headers, options.headers);
    }
  }
  // Merge global headers after user headers, so user headers take precedence
  if (globalHeaders) {
    Object.entries(globalHeaders).forEach(([k, v]) => {
      if (!(k in headers)) headers[k] = v;
    });
  }
  // Set default Accept header if not already set
  if (!headers["Accept"]) {
    headers["Accept"] = "application/json";
  }
  return {
    ...options,
    headers,
    setHeader: (key: string, value: string) => {
      headers[key] = value;
    },
  };
}

export class HttpClient {
  private static globalHeaders: Record<string, string> = {};

  /**
   * Set a global header for all requests (e.g., for authorization).
   */
  static setHeader(key: string, value: string) {
    this.globalHeaders[key] = value;
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

  static async request<T = any>(
    url: string,
    options?: RequestInit
  ): Promise<HttpClientResponse<T>> {
    if (typeof fetch === "undefined") {
      throw new Error(
        "fetch is not available in this environment. For Node.js <18, install a fetch polyfill."
      );
    }
    const finalOptions = createHttpRequestOptions(options, this.globalHeaders);
    const response = await fetch(url, finalOptions);
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
        url,
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

  static async get<T = any>(
    url: string,
    options?: RequestInit
  ): Promise<HttpClientResponse<T>> {
    return this.request<T>(url, { ...options, method: "GET" });
  }

  static async post<T = any>(
    url: string,
    body?: any,
    options?: RequestInit
  ): Promise<HttpClientResponse<T>> {
    const opts = createHttpRequestOptions(options);
    opts.method = "POST";
    opts.body = body ? JSON.stringify(body) : undefined;
    // Only set Content-Type if not already set by user
    if (!opts.headers["Content-Type"]) {
      opts.setHeader("Content-Type", "application/json");
    }
    return this.request<T>(url, opts);
  }

  static async patch<T = any>(
    url: string,
    body?: any,
    options?: RequestInit
  ): Promise<HttpClientResponse<T>> {
    const opts = createHttpRequestOptions(options);
    opts.method = "PATCH";
    opts.body = body ? JSON.stringify(body) : undefined;
    // Only set Content-Type if not already set by user
    if (!opts.headers["Content-Type"]) {
      opts.setHeader("Content-Type", "application/json");
    }
    return this.request<T>(url, opts);
  }

  static async delete<T = any>(
    url: string,
    body?: any,
    options?: RequestInit
  ): Promise<HttpClientResponse<T>> {
    const opts = createHttpRequestOptions(options);
    opts.method = "DELETE";
    if (body !== undefined) {
      opts.body = JSON.stringify(body);
      // Only set Content-Type if not already set by user
      if (!opts.headers["Content-Type"]) {
        opts.setHeader("Content-Type", "application/json");
      }
    }
    return this.request<T>(url, opts);
  }
}

export default HttpClient;
