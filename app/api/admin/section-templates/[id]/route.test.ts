import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH, DELETE } from "./route";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    sectionTemplate: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

const auth = (await import("@/lib/auth")).auth;
const prisma = (await import("@/lib/db")).prisma;

const templateId = "t1";
const ctx = { params: Promise.resolve({ id: templateId }) };

describe("GET /api/admin/section-templates/[id]", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.sectionTemplate.findUnique).mockResolvedValue({ id: templateId, name: "Template" } as any);
  });

  it("returns 401 when not admin", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await GET(new Request("http://localhost"), ctx);
    expect(res.status).toBe(401);
  });

  it("returns 404 when template not found", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    vi.mocked(prisma.sectionTemplate.findUnique).mockResolvedValue(null);
    const res = await GET(new Request("http://localhost"), ctx);
    expect(res.status).toBe(404);
  });

  it("returns 200 with template", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    const res = await GET(new Request("http://localhost"), ctx);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe(templateId);
  });
});

describe("PATCH /api/admin/section-templates/[id]", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.sectionTemplate.findUnique).mockResolvedValue({ id: templateId } as any);
    vi.mocked(prisma.sectionTemplate.update).mockResolvedValue({ id: templateId, name: "Updated" } as any);
  });

  it("returns 401 when not admin", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await PATCH(
      new Request("http://localhost", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{\"name\":\"Updated\"}" }),
      ctx
    );
    expect(res.status).toBe(401);
  });

  it("returns 200 with updated template", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    const res = await PATCH(
      new Request("http://localhost", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{\"name\":\"Updated\"}" }),
      ctx
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe("Updated");
  });
});

describe("DELETE /api/admin/section-templates/[id]", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.sectionTemplate.delete).mockResolvedValue({} as any);
  });

  it("returns 401 when not admin", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await DELETE(new Request("http://localhost"), ctx);
    expect(res.status).toBe(401);
  });

  it("returns 204 on success", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "admin" } } as any);
    const res = await DELETE(new Request("http://localhost"), ctx);
    expect(res.status).toBe(204);
  });
});
