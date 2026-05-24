import { z } from "zod";

const API_BASE = "/api/v1";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public detail?: unknown,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!resp.ok) {
    let detail: unknown;
    try {
      detail = await resp.json();
    } catch {
      detail = await resp.text();
    }
    throw new ApiError(resp.status, `API ${resp.status}`, detail);
  }
  const raw = await resp.json();
  return schema.parse(raw);
}

export const api = {
  get: <T>(path: string, schema: z.ZodType<T>) => request(path, schema),
  post: <T>(path: string, body: unknown, schema: z.ZodType<T>) =>
    request(path, schema, { method: "POST", body: JSON.stringify(body) }),
};

export { ApiError };
