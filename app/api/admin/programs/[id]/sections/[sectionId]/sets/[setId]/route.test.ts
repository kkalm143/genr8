import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH, DELETE } from "./route";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { workoutSet: { findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() } } }));

const auth = (await import("@/lib/auth")).auth;
const prisma = (await import("@/lib/db")).prisma;

const ctx = { params: Promise.resolve({ id: "p1", sectionId: "s1", setId: "set1" }) };

describe("PATCH sets/[setId]", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.workoutSet.findFirst).mockResolvedValue({ id: "set1", reps: "10" } as any);
    vi.mocked(prisma.workoutSet.update).mockResolvedValue({ id: "set1", reps: "12" } as any);
  });
  it("returns 401 when not admin", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const req = new Request("http://localhost", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{\"reps\":\"12\"}" });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(401);
  });
  it("returns 404 when set not found", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    vi.mocked(prisma.workoutSet.findFirst).mockResolvedValue(null);
    const req = new Request("http://localhost", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{\"reps\":\"12\"}" });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(404);
  });
  it("returns 200 with updated set", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    const req = new Request("http://localhost", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{\"reps\":\"12\"}" });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(200);
    expect((await res.json()).reps).toBe("12");
  });
});

describe("DELETE sets/[setId]", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.workoutSet.delete).mockResolvedValue({} as any);
  });
  it("returns 401 when not admin", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    expect((await DELETE(new Request("http://localhost"), ctx)).status).toBe(401);
  });
  it("returns 204 on success", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    expect((await DELETE(new Request("http://localhost"), ctx)).status).toBe(204);
  });
});
