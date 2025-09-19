import type { Session } from "next-auth";

export class AuthError extends Error {
  readonly status: number;
  readonly reason: string;

  constructor(message: string, status: number, reason: string) {
    super(message);
    this.name = "AuthError";
    this.status = status;
    this.reason = reason;
  }
}

export function ensureAuthenticated(session: Session | null): asserts session is Session {
  if (!session?.user?.id) {
    throw new AuthError("Authentication required", 401, "not_authenticated");
  }
}

export function ensureHasScope(session: Session, requiredScopes: string[]) {
  const granted = new Set(session.user.scopes ?? []);
  const missing = requiredScopes.filter(scope => !granted.has(scope));
  if (missing.length > 0) {
    throw new AuthError(`Missing required scope: ${missing.join(", ")}`, 403, "insufficient_scope");
  }
}

export function enforceApiScope(session: Session | null, scopes: string[]) {
  ensureAuthenticated(session);
  ensureHasScope(session, scopes);
}
