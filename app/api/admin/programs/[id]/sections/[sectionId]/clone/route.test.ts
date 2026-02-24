import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    program: { findUnique: vi.fn() },
    workoutSection: { findFirst: vi.fn(), create: vi.fn(), findUnique: vi.fn() },
    workoutSet: { create: vi.fn() },
  },
}));

const auth = (await import("@/lib/auth")).auth;
const prisma = (await import("@/lib/db")).prisma;

const programId = "p1";
const sectionId = "s1";
const ctx = { params: Promise.resolve({ id: programId, sectionId }) };

describe("POST /api/admin/programs/[id]/sections/[sectionId]/clone", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.program.findUnique).mockResolvedValue({ id: programId } as any);
    vi.mocked(prisma.workoutSection.findFirst)
      .mockResolvedValueOnce({ id: sectionId, programId, type: "freestyle", name: "Section", displayOrder: 0, durationSeconds: null, metadata: null, sets: [] } as any)
      .mockResolvedValueOnce({ displayOrder: 0 } as any);
    vi.mocked(prisma.workoutSection.create).mockResolvedValue({ id: "s2", name: "Section" } as any);
    vi.mocked(prisma.workoutSection.findUnique).mockResolvedValue({ id: "s2", sets: [] } as any);
  });

  it("returns 401 when not admin", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await POST(new Request("http://localhost", { method: "POST" }), ctx);
    expect(res.status).toBe(401);
  });

  it("returns 404 when program not found", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    vi.mocked(prisma.program.findUnique).mockResolvedValue(null);
    const res = await POST(new Request("http://localhost", { method: "POST" }), ctx);
    expect(res.status).toBe(404);
  });

  it("returns 404 when section not found", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    vi.mocked(prisma.workoutSection.findFirst).mockReset();
    vi.mocked(prisma.workoutSection.findFirst).mockResolvedValue(null);
    const res = await POST(new Request("http://localhost", { method: "POST" }), ctx);
    expect(res.status).toBe(404);
  });

  it("returns 200 with cloned section", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    const res = await POST(new Request("http://localhost", { method: "POST" }), ctx);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("s2");
  });
});
