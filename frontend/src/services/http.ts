export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

type HttpOptions = RequestInit & { json?: unknown };

export async function http<T>(
  path: string,
  options: HttpOptions = {}
): Promise<T> {
  const { json, headers, ...rest } = options;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": json !== undefined ? "application/json" : "",
      ...(headers || {}),
    },
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Erro HTTP ${res.status} em ${path}: ${errorText}`
    );
  }

  const text = await res.text();
  return text ? JSON.parse(text) : (undefined as T);
}