import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH, DELETE } from "./route";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    workoutSection: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

const auth = (await import("@/lib/auth")).auth;
const prisma = (await import("@/lib/db")).prisma;

const programId = "p1";
const sectionId = "s1";
const ctx = { params: Promise.resolve({ id: programId, sectionId }) };

describe("PATCH /api/admin/programs/[id]/sections/[sectionId]", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.workoutSection.findUnique).mockResolvedValue({ id: sectionId } as any);
    vi.mocked(prisma.workoutSection.update).mockResolvedValue({ id: sectionId, name: "Updated" } as any);
  });

  it("returns 401 when not admin", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await PATCH(
      new Request("http://localhost", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{\"name\":\"Updated\"}" }),
      ctx
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when section not found", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    vi.mocked(prisma.workoutSection.findUnique).mockResolvedValue(null);
    const res = await PATCH(
      new Request("http://localhost", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{\"name\":\"Updated\"}" }),
      ctx
    );
    expect(res.status).toBe(404);
  });

  it("returns 200 with updated section", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    const res = await PATCH(
      new Request("http://localhost", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{\"name\":\"Updated\"}" }),
      ctx
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe("Updated");
  });
});

describe("DELETE /api/admin/programs/[id]/sections/[sectionId]", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.workoutSection.delete).mockResolvedValue({} as any);
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
