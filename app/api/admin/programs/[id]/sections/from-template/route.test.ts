import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    program: { findUnique: vi.fn() },
    sectionTemplate: { findUnique: vi.fn() },
    workoutSection: { findFirst: vi.fn(), create: vi.fn() },
  },
}));

const auth = (await import("@/lib/auth")).auth;
const prisma = (await import("@/lib/db")).prisma;

const programId = "p1";
const ctx = { params: Promise.resolve({ id: programId }) };

describe("POST /api/admin/programs/[id]/sections/from-template", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.program.findUnique).mockResolvedValue({ id: programId } as any);
    vi.mocked(prisma.sectionTemplate.findUnique).mockResolvedValue({
      id: "t1",
      type: "warmup",
      name: "Warmup",
      defaultDuration: 300,
      defaultReps: null,
      metadata: null,
    } as any);
    vi.mocked(prisma.workoutSection.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.workoutSection.create).mockResolvedValue({
      id: "s1",
      programId,
      type: "warmup",
      name: "Warmup",
      displayOrder: 0,
      durationSeconds: 300,
      metadata: null,
    } as any);
  });

  it("returns 401 when not admin", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: "t1" }),
      }),
      ctx
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when templateId missing", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
      ctx
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when program not found", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    vi.mocked(prisma.program.findUnique).mockResolvedValue(null);
    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: "t1" }),
      }),
      ctx
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 when template not found", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    vi.mocked(prisma.sectionTemplate.findUnique).mockResolvedValue(null);
    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: "t1" }),
      }),
      ctx
    );
    expect(res.status).toBe(404);
  });

  it("returns 200 with created section", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: "t1" }),
      }),
      ctx
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.programId).toBe(programId);
    expect(data.name).toBe("Warmup");
  });
});
