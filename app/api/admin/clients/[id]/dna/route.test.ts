import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { user: { findFirst: vi.fn() }, dNAResult: { create: vi.fn() } } }));

const auth = (await import("@/lib/auth")).auth;
const prisma = (await import("@/lib/db")).prisma;

const ctx = { params: Promise.resolve({ id: "c1" }) };

describe("POST /api/admin/clients/[id]/dna", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: "c1", role: "client" } as any);
    vi.mocked(prisma.dNAResult.create).mockResolvedValue({ id: "r1", userId: "c1" } as any);
  });
  it("returns 401 when not admin", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await POST(new Request("http://localhost", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }), ctx);
    expect(res.status).toBe(401);
  });
  it("returns 404 when client not found", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    const res = await POST(new Request("http://localhost", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ summary: "Test" }) }), ctx);
    expect(res.status).toBe(404);
  });
  it("returns 200 with created result", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    const res = await POST(new Request("http://localhost", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ summary: "Test" }) }), ctx);
    expect(res.status).toBe(200);
    expect((await res.json()).userId).toBe("c1");
  });
});
