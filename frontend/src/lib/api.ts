const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000").replace(
  /\/$/,
  ""
);

function resolveUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return `${API_BASE}${path}`;
  return `${API_BASE}/${path}`;
}

export async function apiGet<T>(
  path: string,
  init?: RequestInit,
  signal?: AbortSignal
): Promise<T> {
  const url = resolveUrl(path);

  // DEV: vidi tacno sta se gadja
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[apiGet]", url);
  }

  const res = await fetch(url, {
    ...init,
    method: "GET",
    signal,
    cache: "no-store",
    headers: {
      accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${txt || res.statusText}`);
  }

  return (await res.json()) as T;
}
