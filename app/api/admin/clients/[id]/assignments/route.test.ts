import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findFirst: vi.fn() },
    program: { findUnique: vi.fn() },
    programAssignment: { findUnique: vi.fn(), create: vi.fn() },
  },
}));

const auth = (await import("@/lib/auth")).auth;
const prisma = (await import("@/lib/db")).prisma;

const ctx = { params: Promise.resolve({ id: "c1" }) };

describe("POST /api/admin/clients/[id]/assignments", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: "c1", role: "client" } as any);
    vi.mocked(prisma.program.findUnique).mockResolvedValue({ id: "p1" } as any);
    vi.mocked(prisma.programAssignment.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.programAssignment.create).mockResolvedValue({ id: "pa1", userId: "c1", programId: "p1", program: { id: "p1", name: "P" } } as any);
  });
  it("returns 401 when not admin", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await POST(new Request("http://localhost", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ programId: "p1" }) }), ctx);
    expect(res.status).toBe(401);
  });
  it("returns 400 when programId missing", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    const res = await POST(new Request("http://localhost", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }), ctx);
    expect(res.status).toBe(400);
  });
  it("returns 404 when client not found", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    const res = await POST(new Request("http://localhost", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ programId: "p1" }) }), ctx);
    expect(res.status).toBe(404);
  });
  it("returns 200 with assignment", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    const res = await POST(new Request("http://localhost", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ programId: "p1" }) }), ctx);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.userId).toBe("c1");
    expect(data.programId).toBe("p1");
  });
});
