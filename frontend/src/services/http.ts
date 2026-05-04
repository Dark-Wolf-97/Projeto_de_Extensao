// Centraliza a base URL e fetch helper.
// Mesmo padrão do api.js original do projeto.
export const API_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:3000";

type HttpOptions = RequestInit & { json?: unknown };

export async function http<T>(path: string, options: HttpOptions = {}): Promise<T> {
  const { json, headers, ...rest } = options;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(headers || {}),
    },
    body: json !== undefined ? JSON.stringify(json) : (rest.body as BodyInit | undefined),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} em ${path}`);
  }
  // DELETE/PUT podem não retornar body
  const text = await res.text();
  return (text ? JSON.parse(text) : (undefined as unknown)) as T;
}

// Wrapper que devolve fallback mock se o backend não estiver disponível.
export async function safeRequest<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn("[API] Backend indisponível, usando dados mock.", err);
    return fallback;
  }
}
