import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH, DELETE } from "./route";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    dNAResult: { findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

const auth = (await import("@/lib/auth")).auth;
const prisma = (await import("@/lib/db")).prisma;

const userId = "c1";
const resultId = "r1";
const ctx = { params: Promise.resolve({ id: userId, resultId }) };

describe("GET /api/admin/clients/[id]/dna/[resultId]", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.dNAResult.findFirst).mockResolvedValue({
      id: resultId,
      userId,
      summary: "Summary",
      fieldValues: {},
      rawFileUrl: null,
    } as any);
  });

  it("returns 401 when not admin", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await GET(new Request("http://localhost"), ctx);
    expect(res.status).toBe(401);
  });

  it("returns 404 when result not found", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    vi.mocked(prisma.dNAResult.findFirst).mockResolvedValue(null);
    const res = await GET(new Request("http://localhost"), ctx);
    expect(res.status).toBe(404);
  });

  it("returns 200 with result", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    const res = await GET(new Request("http://localhost"), ctx);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe(resultId);
    expect(data.summary).toBe("Summary");
  });
});

describe("PATCH /api/admin/clients/[id]/dna/[resultId]", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.dNAResult.findFirst).mockResolvedValue({ id: resultId, userId } as any);
    vi.mocked(prisma.dNAResult.update).mockResolvedValue({ id: resultId, summary: "Updated" } as any);
  });

  it("returns 401 when not admin", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await PATCH(
      new Request("http://localhost", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{\"summary\":\"Updated\"}" }),
      ctx
    );
    expect(res.status).toBe(401);
  });

  it("returns 200 with updated result", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    const res = await PATCH(
      new Request("http://localhost", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{\"summary\":\"Updated\"}" }),
      ctx
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.summary).toBe("Updated");
  });
});

describe("DELETE /api/admin/clients/[id]/dna/[resultId]", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.dNAResult.findFirst).mockResolvedValue({ id: resultId, userId } as any);
    vi.mocked(prisma.dNAResult.delete).mockResolvedValue({} as any);
  });

  it("returns 401 when not admin", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await DELETE(new Request("http://localhost"), ctx);
    expect(res.status).toBe(401);
  });

  it("returns 204 on success", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    const res = await DELETE(new Request("http://localhost"), ctx);
    expect(res.status).toBe(204);
  });
});
