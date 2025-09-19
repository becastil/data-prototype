import { describe, it, expect } from "vitest";
import type { Session } from "next-auth";
import { ensureAuthenticated, ensureHasScope, enforceApiScope, AuthError } from "../../app/middleware";

const baseSession: Session = {
  user: {
    id: "user-1",
    email: "user@example.com",
    name: "Test User",
    role: "analyst",
    scopes: ["phi:read"]
  },
  expires: new Date(Date.now() + 60_000).toISOString()
};

describe("RBAC helpers", () => {
  it("throws when session is missing", () => {
    expect(() => ensureAuthenticated(null)).toThrow(AuthError);
  });

  it("does not throw for a valid session", () => {
    expect(() => ensureAuthenticated(baseSession)).not.toThrow();
  });

  it("throws when required scopes are missing", () => {
    const session: Session = {
      ...baseSession,
      user: { ...baseSession.user, scopes: [] }
    };
    expect(() => ensureHasScope(session, ["phi:read"]))
      .toThrowError(/Missing required scope/);
  });

  it("allows when all scopes are granted", () => {
    expect(() => enforceApiScope(baseSession, ["phi:read"]))
      .not.toThrow();
  });
});
