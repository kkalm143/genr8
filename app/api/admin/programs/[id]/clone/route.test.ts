import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    program: { findUnique: vi.fn(), create: vi.fn() },
    workoutSection: { findFirst: vi.fn(), create: vi.fn() },
    workoutSet: { create: vi.fn() },
  },
}));

const auth = (await import("@/lib/auth")).auth;
const prisma = (await import("@/lib/db")).prisma;

const programId = "p1";
const ctx = { params: Promise.resolve({ id: programId }) };

describe("POST /api/admin/programs/[id]/clone", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.program.findUnique).mockResolvedValue({
      id: programId,
      name: "Original",
      description: null,
      content: null,
      isActive: true,
      displayOrder: 0,
      workoutSections: [],
    } as any);
    vi.mocked(prisma.program.create).mockResolvedValue({ id: "p2", name: "Original (Copy)" } as any);
    vi.mocked(prisma.workoutSection.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.program.findUnique).mockImplementation(async (args: any) => {
      if (args?.where?.id === "p2") return { id: "p2", name: "Original (Copy)", workoutSections: [] } as any;
      return { id: programId, name: "Original", workoutSections: [] } as any;
    });
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

  it("returns 200 with cloned program", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    const res = await POST(new Request("http://localhost", { method: "POST" }), ctx);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("p2");
    expect(data.name).toBe("Original (Copy)");
  });
});
