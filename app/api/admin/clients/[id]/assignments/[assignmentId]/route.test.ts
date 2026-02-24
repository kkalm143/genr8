import { describe, it, expect, vi, beforeEach } from "vitest";
import { DELETE } from "./route";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { programAssignment: { findFirst: vi.fn(), delete: vi.fn() } } }));

const auth = (await import("@/lib/auth")).auth;
const prisma = (await import("@/lib/db")).prisma;

const ctx = { params: Promise.resolve({ id: "c1", assignmentId: "pa1" }) };

describe("DELETE /api/admin/clients/[id]/assignments/[assignmentId]", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.programAssignment.findFirst).mockResolvedValue({ id: "pa1", userId: "c1" } as any);
    vi.mocked(prisma.programAssignment.delete).mockResolvedValue({} as any);
  });
  it("returns 401 when not admin", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    expect((await DELETE(new Request("http://localhost"), ctx)).status).toBe(401);
  });
  it("returns 404 when assignment not found", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    vi.mocked(prisma.programAssignment.findFirst).mockResolvedValue(null);
    expect((await DELETE(new Request("http://localhost"), ctx)).status).toBe(404);
  });
  it("returns 204 on success", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    expect((await DELETE(new Request("http://localhost"), ctx)).status).toBe(204);
  });
});
