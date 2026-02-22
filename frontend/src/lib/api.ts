"use client";

const BACKEND = "http://127.0.0.1:8000";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(^|;\\s*)" + name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + "=([^;]*)"));
  return m ? m[2] : null;
}

async function ensureCsrfCookie() {
  // Sanctum CSRF cookie endpoint sets XSRF-TOKEN + session cookie
  await fetch(`${BACKEND}/sanctum/csrf-cookie`, {
    method: "GET",
    credentials: "include",
    headers: { accept: "application/json" },
  });
}

function xsrfHeader(): Record<string, string> {
  const token = readCookie("XSRF-TOKEN");
  if (!token) return {};
  // cookie is url-encoded
  const decoded = decodeURIComponent(token);
  return { "X-XSRF-TOKEN": decoded };
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${BACKEND}${path}`;

  const method = (init.method ?? "GET").toUpperCase();
  const isWrite = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  // ✅ For write requests, we must have CSRF cookie + header
  if (isWrite) {
    await ensureCsrfCookie();
  }

  const headers: Record<string, string> = {
    accept: "application/json",
    ...(init.headers as any),
  };

  if (isWrite) {
    Object.assign(headers, xsrfHeader());
    if (!headers["content-type"] && !(init.body instanceof FormData)) {
      headers["content-type"] = "application/json";
    }
  }

  const res = await fetch(url, {
    ...init,
    method,
    credentials: "include", // ✅ critical
    headers,
  });

  if (res.status === 204) return {} as T;

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg = json?.message || json?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return json as T;
}

export function apiGet<T>(path: string, init?: RequestInit) {
  return apiFetch<T>(path, { ...(init ?? {}), method: "GET" });
}

export function apiPost<T>(path: string, body?: any, init?: RequestInit) {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  return apiFetch<T>(path, {
    ...(init ?? {}),
    method: "POST",
    body: isForm ? body : JSON.stringify(body ?? {}),
  });
}

export function apiPut<T>(path: string, body?: any, init?: RequestInit) {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  return apiFetch<T>(path, {
    ...(init ?? {}),
    method: "PUT",
    body: isForm ? body : JSON.stringify(body ?? {}),
  });
}

export function apiDelete<T>(path: string, init?: RequestInit) {
  return apiFetch<T>(path, { ...(init ?? {}), method: "DELETE" });
}