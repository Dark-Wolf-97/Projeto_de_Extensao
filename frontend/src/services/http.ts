export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type HttpOptions = RequestInit & { json?: unknown };

export async function http<T>(path: string, options: HttpOptions = {}): Promise<T> {
  const { json, headers, ...rest } = options;
  const token = localStorage.getItem('token');

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    let detail = text;
    try {
      const parsed = JSON.parse(text);
      const msg = parsed.message;
      detail = Array.isArray(msg) ? msg.join(', ') : String(msg ?? text);
    } catch {
      // mantém o text bruto
    }
    throw new Error(`${res.status}:${detail}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : (undefined as T);
}

export function httpErrorMessage(err: unknown): { status: string; detail: string } {
  const raw = err instanceof Error ? err.message : String(err);
  const colonIdx = raw.indexOf(':');
  if (colonIdx === -1) return { status: '', detail: raw };
  return {
    status: raw.slice(0, colonIdx),
    detail: raw.slice(colonIdx + 1),
  };
}
