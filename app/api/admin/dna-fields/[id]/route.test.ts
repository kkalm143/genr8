import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH, DELETE } from "./route";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { dNAInterpretationField: { update: vi.fn(), delete: vi.fn() } } }));

const auth = (await import("@/lib/auth")).auth;
const prisma = (await import("@/lib/db")).prisma;

const ctx = { params: Promise.resolve({ id: "f1" }) };

describe("PATCH /api/admin/dna-fields/[id]", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.dNAInterpretationField.update).mockResolvedValue({ id: "f1", name: "Updated" } as any);
  });
  it("returns 401 when not admin", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await PATCH(new Request("http://localhost", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{\"name\":\"Updated\"}" }), ctx);
    expect(res.status).toBe(401);
  });
  it("returns 200 with updated field", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    const res = await PATCH(new Request("http://localhost", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{\"name\":\"Updated\"}" }), ctx);
    expect(res.status).toBe(200);
    expect((await res.json()).name).toBe("Updated");
  });
});

describe("DELETE /api/admin/dna-fields/[id]", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.dNAInterpretationField.delete).mockResolvedValue({} as any);
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
