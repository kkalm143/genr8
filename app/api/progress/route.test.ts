import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    progressEntry: { findMany: vi.fn(), create: vi.fn() },
    programAssignment: { findFirst: vi.fn() },
  },
}));

const auth = (await import("@/lib/auth")).auth;
const prisma = (await import("@/lib/db")).prisma;

describe("GET /api/progress", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.progressEntry.findMany).mockResolvedValue([]);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 200 with entries when authenticated", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1", role: "client" } } as any);
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

describe("POST /api/progress", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.progressEntry.create).mockResolvedValue({
      id: "pe1",
      content: "Note",
      type: "note",
      userId: "u1",
      programAssignmentId: null,
      value: null,
      loggedAt: null,
      createdAt: new Date(),
    } as any);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await POST(
      new Request("http://localhost/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Note" }),
      })
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when content missing", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1", role: "client" } } as any);
    const res = await POST(
      new Request("http://localhost/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 200 with entry when success", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1", role: "client" } } as any);
    vi.mocked(prisma.progressEntry.create).mockResolvedValue({
      id: "pe1",
      content: "My note",
      type: "note",
      userId: "u1",
      programAssignmentId: null,
      value: null,
      loggedAt: null,
      createdAt: new Date(),
    } as any);
    const res = await POST(
      new Request("http://localhost/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "My note" }),
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.content).toBe("My note");
  });
});
