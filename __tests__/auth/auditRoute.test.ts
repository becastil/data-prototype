import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetServerAuthSession = vi.fn();

vi.mock("../../app/lib/auth", () => ({
  getServerAuthSession: mockGetServerAuthSession
}));

describe("/api/audit/logs", () => {
  beforeEach(() => {
    mockGetServerAuthSession.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockGetServerAuthSession.mockResolvedValue(null);
    const { GET } = await import("../../app/api/audit/logs/route");
    const response = await GET();
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("not_authenticated");
  });

  it("rejects sessions without the phi:read scope", async () => {
    mockGetServerAuthSession.mockResolvedValue({
      user: {
        id: "user-2",
        email: "analyst@example.com",
        role: "analyst",
        scopes: []
      },
      expires: new Date(Date.now() + 60_000).toISOString()
    });
    const { GET } = await import("../../app/api/audit/logs/route");
    const response = await GET();
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("insufficient_scope");
  });

  it("returns audit logs for authorized sessions", async () => {
    mockGetServerAuthSession.mockResolvedValue({
      user: {
        id: "user-3",
        email: "admin@example.com",
        role: "admin",
        scopes: ["phi:read"]
      },
      expires: new Date(Date.now() + 60_000).toISOString()
    });
    const { GET } = await import("../../app/api/audit/logs/route");
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.logs)).toBe(true);
    expect(body.logs[0]).toMatchObject({ action: "bootstrap" });
  });
});
