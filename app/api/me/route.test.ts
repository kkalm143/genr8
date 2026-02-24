import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH } from "./route";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

const auth = (await import("@/lib/auth")).auth;
const prisma = (await import("@/lib/db")).prisma;

describe("GET /api/me", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      email: "u@test.com",
      name: "User",
      role: "client",
      clientProfile: { phone: null, timezone: null, dateOfBirth: null, onboardingCompletedAt: null },
    } as any);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 404 when user not found", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1", role: "client" } } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it("returns 200 with user when authenticated", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1", role: "client" } } as any);
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("u1");
    expect(data.email).toBe("u@test.com");
  });
});

describe("PATCH /api/me", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      clientProfile: { id: "cp1" },
    } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await PATCH(
      new Request("http://localhost/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Name" }),
      })
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when user not found", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1", role: "client" } } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const res = await PATCH(
      new Request("http://localhost/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Name" }),
      })
    );
    expect(res.status).toBe(404);
  });
});
