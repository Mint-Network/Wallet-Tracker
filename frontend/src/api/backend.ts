/**
 * Backend API base URL. In the Tauri app this comes from the Rust side;
 * in browser/dev it uses env or default.
 */
const DEFAULT_BACKEND_URL = "http://127.0.0.1:55001";

let cachedBaseUrl: string | null = null;

/**
 * Returns the backend API base URL (no trailing slash).
 * Uses Tauri invoke when running inside the packaged app, otherwise
 * VITE_API_BASE_URL or default.
 */
export async function getBackendBaseUrl(): Promise<string> {
  if (cachedBaseUrl) return cachedBaseUrl;

  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const url = await invoke<string>("get_backend_url");
    cachedBaseUrl = url || DEFAULT_BACKEND_URL;
  } catch {
    cachedBaseUrl =
      (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
      DEFAULT_BACKEND_URL;
  }

  return cachedBaseUrl;
}

/**
 * Fetch with retries on connection-type failures (backend not ready yet).
 * Retries up to `maxRetries` times with `delayMs` between attempts.
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  delayMs = 800
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (e) {
      lastError = e;
      const isConnectionError =
        e instanceof TypeError &&
        (e.message === "Failed to fetch" || e.message.includes("NetworkError"));
      if (attempt < maxRetries && isConnectionError) {
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      throw e;
    }
  }
  throw lastError;
}
