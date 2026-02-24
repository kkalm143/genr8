import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { dNAInterpretationField: { findMany: vi.fn(), create: vi.fn() } } }));

const auth = (await import("@/lib/auth")).auth;
const prisma = (await import("@/lib/db")).prisma;

describe("GET /api/admin/dna-fields", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.dNAInterpretationField.findMany).mockResolvedValue([]);
  });
  it("returns 401 when not admin", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
  });
  it("returns 200 with fields", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });
});

describe("POST /api/admin/dna-fields", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.dNAInterpretationField.create).mockResolvedValue({ id: "f1", name: "Field", type: "scale" } as any);
  });
  it("returns 401 when not admin", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await POST(new Request("http://localhost", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Field" }) }));
    expect(res.status).toBe(401);
  });
  it("returns 400 when name missing", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    const res = await POST(new Request("http://localhost", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }));
    expect(res.status).toBe(400);
  });
  it("returns 200 with created field", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    const res = await POST(new Request("http://localhost", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Field" }) }));
    expect(res.status).toBe(200);
    expect((await res.json()).name).toBe("Field");
  });
});
