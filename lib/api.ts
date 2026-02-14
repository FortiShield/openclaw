import { env } from "./env";

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
};

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "BAD_REQUEST"
  | "INTERNAL_SERVER_ERROR"
  | "GATEWAY_ERROR"
  | "TIMEOUT";

class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Fetch wrapper with error handling and timeout
 */
async function apiFetch<T>(
  url: string,
  options?: RequestInit,
  timeoutMs: number = 30000
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {
        // Ignore JSON parse errors
      }

      throw new ApiError(
        (errorData.code || "INTERNAL_SERVER_ERROR") as ApiErrorCode,
        errorData.message || response.statusText || "API request failed",
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeout);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("TIMEOUT", "Request timeout after 30 seconds", 408);
    }

    if (error instanceof TypeError) {
      throw new ApiError("GATEWAY_ERROR", "Network error: " + error.message, 503);
    }

    throw new ApiError(
      "INTERNAL_SERVER_ERROR",
      error instanceof Error ? error.message : "Unknown error",
      500
    );
  }
}

/**
 * GET request
 */
export function apiGet<T>(path: string, options?: RequestInit): Promise<T> {
  const url = new URL(path, env.gatewayBaseUrl).toString();
  return apiFetch<T>(url, { ...options, method: "GET" });
}

/**
 * POST request
 */
export function apiPost<T>(
  path: string,
  body?: unknown,
  options?: RequestInit
): Promise<T> {
  const url = new URL(path, env.gatewayBaseUrl).toString();
  return apiFetch<T>(url, {
    ...options,
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT request
 */
export function apiPut<T>(
  path: string,
  body?: unknown,
  options?: RequestInit
): Promise<T> {
  const url = new URL(path, env.gatewayBaseUrl).toString();
  return apiFetch<T>(url, {
    ...options,
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request
 */
export function apiDelete<T>(path: string, options?: RequestInit): Promise<T> {
  const url = new URL(path, env.gatewayBaseUrl).toString();
  return apiFetch<T>(url, { ...options, method: "DELETE" });
}

export { ApiError };
