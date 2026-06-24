const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

function token(): string | null {
  return localStorage.getItem('tt_jwt');
}

export function setToken(t: string | null) {
  if (t) localStorage.setItem('tt_jwt', t);
  else localStorage.removeItem('tt_jwt');
}

function authHeaders(extra?: HeadersInit): HeadersInit {
  const t = token();
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}), ...extra };
}

export async function apiGet<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await fetch(url.toString(), { headers: authHeaders() });
  if (!r.ok) { const e = await r.json().catch(() => ({ error: r.statusText })); throw new Error((e as any).error ?? r.statusText); }
  return r.json() as Promise<T>;
}

export async function apiPost<T = unknown>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(`${BASE}${path}`, { method: 'POST', headers: authHeaders(), body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) { const e = await r.json().catch(() => ({ error: r.statusText })); throw new Error((e as any).error ?? r.statusText); }
  return r.json() as Promise<T>;
}

export async function apiPatch<T = unknown>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(`${BASE}${path}`, { method: 'PATCH', headers: authHeaders(), body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) { const e = await r.json().catch(() => ({ error: r.statusText })); throw new Error((e as any).error ?? r.statusText); }
  return r.json() as Promise<T>;
}

export async function apiDelete(path: string): Promise<void> {
  const r = await fetch(`${BASE}${path}`, { method: 'DELETE', headers: authHeaders() });
  if (!r.ok) { const e = await r.json().catch(() => ({ error: r.statusText })); throw new Error((e as any).error ?? r.statusText); }
}

export async function apiPut<T = unknown>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(`${BASE}${path}`, { method: 'PUT', headers: authHeaders(), body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) { const e = await r.json().catch(() => ({ error: r.statusText })); throw new Error((e as any).error ?? r.statusText); }
  return r.json() as Promise<T>;
}
