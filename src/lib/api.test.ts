import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPost, setToken } from "./api";

describe("api helper", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("uses same-origin api paths and auth headers", async () => {
    setToken("abc");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })));

    await expect(apiGet("/api/health", { q: "x" })).resolves.toEqual({ ok: true });

    const [url, init] = (fetch as any).mock.calls[0];
    expect(url).toBe("http://localhost:3000/api/health?q=x");
    expect(init.headers.Authorization).toBe("Bearer abc");
  });

  it("throws server error payloads", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "bad" }), { status: 400 })));
    await expect(apiPost("/api/test", { a: 1 })).rejects.toThrow("bad");
  });
});
