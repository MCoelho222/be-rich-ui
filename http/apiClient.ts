import axios, { AxiosRequestConfig, AxiosResponse, Method } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface RequestOptions {
  method: Method;
  endpoint: string;
  payload?: unknown;
  headers?: Record<string, string>;
}

/**
 * Generic API request function
 * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param endpoint - API endpoint path (e.g., "/entries/", "/entries/123")
 * @param payload - Optional request body data
 * @param headers - Optional custom headers
 * @returns Axios response
 */
export const apiRequest = async <T = unknown>(
  method: Method,
  endpoint: string,
  payload?: unknown,
  headers?: Record<string, string>
): Promise<AxiosResponse<T>> => {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: AxiosRequestConfig = {
    method,
    url,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (payload) {
    config.data = payload;
  }

  return axios(config);
};

// Convenience methods for common HTTP operations
export const get = <T = unknown>(endpoint: string, headers?: Record<string, string>) =>
  apiRequest<T>("GET", endpoint, undefined, headers);

export const post = <T = unknown>(
  endpoint: string,
  payload: unknown,
  headers?: Record<string, string>
) => apiRequest<T>("POST", endpoint, payload, headers);

export const put = <T = unknown>(
  endpoint: string,
  payload: unknown,
  headers?: Record<string, string>
) => apiRequest<T>("PUT", endpoint, payload, headers);

export const del = <T = unknown>(endpoint: string, headers?: Record<string, string>) =>
  apiRequest<T>("DELETE", endpoint, undefined, headers);

export const patch = <T = unknown>(
  endpoint: string,
  payload: unknown,
  headers?: Record<string, string>
) => apiRequest<T>("PATCH", endpoint, payload, headers);
