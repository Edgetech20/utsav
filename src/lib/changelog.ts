import { db } from "@/lib/db";

/** Write an audit log entry. Fire-and-forget safe — errors are swallowed. */
export async function logChange(
  email: string,
  action: string,
  resource: string,
  detail?: Record<string, unknown>,
  ip?: string,
): Promise<void> {
  try {
    await db.changeLog.create({
      data: {
        email,
        action,
        resource,
        detail: detail ? JSON.stringify(detail) : null,
        ip: ip ?? null,
      },
    });
  } catch {
    // Non-critical — never break the main flow
  }
}
