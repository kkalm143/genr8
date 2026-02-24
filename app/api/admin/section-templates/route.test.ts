import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { sectionTemplate: { findMany: vi.fn(), create: vi.fn() } } }));

const auth = (await import("@/lib/auth")).auth;
const prisma = (await import("@/lib/db")).prisma;

describe("GET /api/admin/section-templates", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.sectionTemplate.findMany).mockResolvedValue([]);
  });
  it("returns 401 when not admin", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
  });
  it("returns 200 with templates", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });
});

describe("POST /api/admin/section-templates", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.sectionTemplate.create).mockResolvedValue({ id: "t1", name: "Warmup", type: "freestyle" } as any);
  });
  it("returns 401 when not admin", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await POST(new Request("http://localhost", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Warmup", type: "freestyle" }) }));
    expect(res.status).toBe(401);
  });
  it("returns 200 with created template", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    const res = await POST(new Request("http://localhost", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Warmup", type: "freestyle" }) }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe("Warmup");
  });
});
