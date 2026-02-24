import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    workoutSection: { findUnique: vi.fn() },
    workoutSet: { create: vi.fn() },
  },
}));

const auth = (await import("@/lib/auth")).auth;
const prisma = (await import("@/lib/db")).prisma;

const programId = "p1";
const sectionId = "s1";
const ctx = { params: Promise.resolve({ id: programId, sectionId }) };

describe("POST /api/admin/programs/[id]/sections/[sectionId]/sets", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.workoutSection.findUnique).mockResolvedValue({
      id: sectionId,
      sets: [{ displayOrder: 0 }],
    } as any);
    vi.mocked(prisma.workoutSet.create).mockResolvedValue({
      id: "set1",
      sectionId,
      exerciseId: null,
      reps: "10",
      displayOrder: 1,
    } as any);
  });

  it("returns 401 when not admin", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reps: "10" }),
      }),
      ctx
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when section not found", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    vi.mocked(prisma.workoutSection.findUnique).mockResolvedValue(null);
    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reps: "10" }),
      }),
      ctx
    );
    expect(res.status).toBe(404);
  });

  it("returns 200 with created set", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reps: "10" }),
      }),
      ctx
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.sectionId).toBe(sectionId);
  });
});
