import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH } from "./route";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    programAssignment: { findFirst: vi.fn(), update: vi.fn() },
  },
}));

const auth = (await import("@/lib/auth")).auth;
const prisma = (await import("@/lib/db")).prisma;

describe("PATCH /api/me/assignments/[assignmentId]", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.programAssignment.findFirst).mockResolvedValue({
      id: "pa1",
      userId: "u1",
      status: "assigned",
    } as any);
    vi.mocked(prisma.programAssignment.update).mockResolvedValue({
      id: "pa1",
      status: "in_progress",
      program: { id: "p1", name: "Program" },
    } as any);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await PATCH(
      new Request("http://localhost/api/me/assignments/pa1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_progress" }),
      }),
      { params: Promise.resolve({ assignmentId: "pa1" }) }
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when assignment not found", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1", role: "client" } } as any);
    vi.mocked(prisma.programAssignment.findFirst).mockResolvedValue(null);
    const res = await PATCH(
      new Request("http://localhost/api/me/assignments/pa1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_progress" }),
      }),
      { params: Promise.resolve({ assignmentId: "pa1" }) }
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 when status invalid", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1", role: "client" } } as any);
    const res = await PATCH(
      new Request("http://localhost/api/me/assignments/pa1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "invalid" }),
      }),
      { params: Promise.resolve({ assignmentId: "pa1" }) }
    );
    expect(res.status).toBe(400);
  });

  it("returns 200 with updated assignment when success", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1", role: "client" } } as any);
    const res = await PATCH(
      new Request("http://localhost/api/me/assignments/pa1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_progress" }),
      }),
      { params: Promise.resolve({ assignmentId: "pa1" }) }
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("in_progress");
  });
});
