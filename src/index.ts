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

export class HttpClient {
  static async request<T = any>(
    url: string,
    options?: RequestInit
  ): Promise<HttpClientResponse<T>> {
    if (typeof fetch === "undefined") {
      throw new Error(
        "fetch is not available in this environment. For Node.js <18, install a fetch polyfill."
      );
    }
    const response = await fetch(url, options);
    let data: any = undefined;
    const contentType = response.headers.get("content-type") ?? "";
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
        options,
        method: options?.method ?? "GET",
        body: options?.body,
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
    return this.request<T>(url, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });
  }

  static async patch<T = any>(
    url: string,
    body?: any,
    options?: RequestInit
  ): Promise<HttpClientResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });
  }

  static async delete<T = any>(
    url: string,
    options?: RequestInit
  ): Promise<HttpClientResponse<T>> {
    return this.request<T>(url, { ...options, method: "DELETE" });
  }
}

export default HttpClient;
