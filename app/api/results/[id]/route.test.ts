import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    dNAResult: { findFirst: vi.fn() },
    dNAInterpretationField: { findMany: vi.fn() },
  },
}));

const auth = (await import("@/lib/auth")).auth;
const prisma = (await import("@/lib/db")).prisma;

describe("GET /api/results/[id]", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.dNAResult.findFirst).mockResolvedValue({
      id: "r1",
      summary: "Summary",
      rawFileUrl: null,
      createdAt: new Date(),
      fieldValues: {},
    } as any);
    vi.mocked(prisma.dNAInterpretationField.findMany).mockResolvedValue([]);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await GET(
      new Request("http://localhost/api/results/r1"),
      { params: Promise.resolve({ id: "r1" }) }
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when result not found", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1", role: "client" } } as any);
    vi.mocked(prisma.dNAResult.findFirst).mockResolvedValue(null);
    const res = await GET(
      new Request("http://localhost/api/results/r1"),
      { params: Promise.resolve({ id: "r1" }) }
    );
    expect(res.status).toBe(404);
  });

  it("returns 200 with result when found", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1", role: "client" } } as any);
    const res = await GET(
      new Request("http://localhost/api/results/r1"),
      { params: Promise.resolve({ id: "r1" }) }
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("r1");
    expect(data.summary).toBe("Summary");
    expect(Array.isArray(data.fields)).toBe(true);
  });
});
