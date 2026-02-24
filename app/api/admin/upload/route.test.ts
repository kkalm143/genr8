import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@vercel/blob", () => ({ put: vi.fn().mockResolvedValue({ url: "https://blob.example.com/f.txt" }) }));

const auth = (await import("@/lib/auth")).auth;

describe("POST /api/admin/upload", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";
  });

  it("returns 401 when not admin", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const fd = new FormData();
    fd.set("file", new Blob(["x"]), "f.txt");
    const res = await POST(new Request("http://localhost", { method: "POST", body: fd }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when no file", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    const res = await POST(new Request("http://localhost", { method: "POST", body: new FormData() }));
    expect(res.status).toBe(400);
  });

  it("returns 200 with url when file provided and token set", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    const fd = new FormData();
    fd.set("file", new Blob(["x"]), "f.txt");
    const res = await POST(new Request("http://localhost", { method: "POST", body: fd }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toBeDefined();
  });
});
