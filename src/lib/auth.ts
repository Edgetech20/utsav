import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { splitPerm } from "@/lib/permissions";

export type SessionUser = {
  email: string;
  name: string | null;
  role: string;
  roles: string[];
  permissions: Array<{ resource: string; action: string }>;
};

/** Resolve a session token to the user with permissions flattened from their roles. */
export async function getUserByToken(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;

  const session = await db.adminSession.findUnique({
    where: { token },
    include: { user: { include: {
      roles: { include: { role: { include: { permissions: true } } } },
    } } },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await db.adminSession.delete({ where: { token } }).catch(() => {});
    return null;
  }

  const { user } = session;
  const keys = new Set(user.roles.flatMap(ur => ur.role.permissions.map(rp => rp.perm)));

  return {
    email: user.email,
    name: user.name,
    role: user.role,
    roles: user.roles.map(ur => ur.role.name),
    permissions: [...keys].map(splitPerm),
  };
}

/** Look up the session cookie and return the user, or null if invalid/expired. */
export function getSessionUser(req: NextRequest): Promise<SessionUser | null> {
  return getUserByToken(req.cookies.get("admin_session")?.value);
}

/**
 * Returns true if the user can perform the given action on the resource.
 * - Super role always returns true.
 * - "view" is granted by any permission on the resource (you can't act on what you can't see).
 * - Every other action must be granted exactly — "edit" does NOT imply "delete".
 */
export function can(user: SessionUser, resource: string, action: string): boolean {
  if (user.role === "super") return true;
  return user.permissions.some(p => p.resource === resource && (action === "view" || p.action === action));
}

/**
 * Form-specific permission check: checks form:[slug] first, falls back to global "forms".
 */
export function canForm(user: SessionUser, slug: string, action: string): boolean {
  if (user.role === "super") return true;
  return can(user, `form:${slug}`, action) || can(user, "forms", action);
}

/** Extract client IP from request headers. */
export function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";
}

/** Session + permission check for API routes: returns `{ user }` or `{ err }` (401/403 response). */
export async function requirePerm(req: NextRequest, resource: string, action: string):
  Promise<{ user: SessionUser; err?: undefined } | { user?: undefined; err: Response }> {
  const user = await getSessionUser(req);
  if (!user) return { err: Response.json({ error: "Unauthorised" }, { status: 401 }) };
  if (!can(user, resource, action)) return { err: Response.json({ error: "Forbidden" }, { status: 403 }) };
  return { user };
}
