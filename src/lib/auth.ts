import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export type SessionUser = {
  email: string;
  name: string | null;
  role: string;
  permissions: Array<{ resource: string; action: string }>;
};

/** Look up the session cookie and return the user, or null if invalid/expired. */
export async function getSessionUser(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get("admin_session")?.value;
  if (!token) return null;

  const session = await db.adminSession.findUnique({
    where: { token },
    include: { user: { include: { permissions: true } } },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await db.adminSession.delete({ where: { token } }).catch(() => {});
    return null;
  }

  return {
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    permissions: session.user.permissions,
  };
}

/**
 * Returns true if the user can perform the given action on the resource.
 * - Super role always returns true.
 * - "edit" permission implies "view".
 */
export function can(user: SessionUser, resource: string, action: "view" | "edit"): boolean {
  if (user.role === "super") return true;
  return user.permissions.some(
    p => p.resource === resource && (p.action === action || (action === "view" && p.action === "edit"))
  );
}

/**
 * Form-specific permission check: checks form:[slug] first, falls back to global "forms".
 */
export function canForm(user: SessionUser, slug: string, action: "view" | "edit"): boolean {
  if (user.role === "super") return true;
  return can(user, `form:${slug}`, action) || can(user, "forms", action);
}

/** Extract client IP from request headers. */
export function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";
}
