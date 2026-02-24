import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    programAssignment: { findFirst: vi.fn() },
  },
}));

const auth = (await import("@/lib/auth")).auth;
const prisma = (await import("@/lib/db")).prisma;

describe("GET /api/programs/[id]", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.programAssignment.findFirst).mockResolvedValue({
      id: "pa1",
      userId: "u1",
      programId: "p1",
      program: { id: "p1", name: "Program A" },
    } as any);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await GET(
      new Request("http://localhost/api/programs/p1"),
      { params: Promise.resolve({ id: "p1" }) }
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when assignment not found", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1", role: "client" } } as any);
    vi.mocked(prisma.programAssignment.findFirst).mockResolvedValue(null);
    const res = await GET(
      new Request("http://localhost/api/programs/p1"),
      { params: Promise.resolve({ id: "p1" }) }
    );
    expect(res.status).toBe(404);
  });

  it("returns 200 with assignment when found", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1", role: "client" } } as any);
    const res = await GET(
      new Request("http://localhost/api/programs/p1"),
      { params: Promise.resolve({ id: "p1" }) }
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.programId).toBe("p1");
    expect(data.program.name).toBe("Program A");
  });
});
