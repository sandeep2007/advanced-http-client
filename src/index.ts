export interface HttpRequestOptions extends RequestInit {
  url: string;
}

export class HttpClient {
  static async request(url: string, options?: RequestInit): Promise<Response> {
    if (typeof fetch === "undefined") {
      throw new Error(
        "fetch is not available in this environment. For Node.js <18, install a fetch polyfill."
      );
    }
    return fetch(url, options);
  }
}

export default HttpClient;
