import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { Session } from "next-auth";
import { logger } from "@/lib/logger";

/**
 * Require an authenticated session. Returns 401 response if not logged in.
 * Use session.user.id and session.user.role (typed) in the route handler.
 */
export async function requireAuth(): Promise<
  Session | NextResponse<unknown>
> {
  const session = await auth();
  if (!session?.user) {
    logger.info("Unauthorized request", { event: "auth_required", status: 401 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session as Session;
}

/**
 * Require an admin session. Returns 401 if not logged in or not admin.
 */
export async function requireAdmin(): Promise<
  Session | NextResponse<unknown>
> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    logger.info("Admin access denied", {
      event: "admin_required",
      status: 401,
      userId: session?.user?.id,
      role: session?.user?.role,
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session as Session;
}

/**
 * Require a client session (not admin). Returns 401 if not logged in, 403 if admin.
 */
export async function requireClient(): Promise<
  Session | NextResponse<unknown>
> {
  const session = await auth();
  if (!session?.user) {
    logger.info("Unauthorized request", { event: "auth_required", status: 401 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role === "admin") {
    logger.info("Client-only route accessed by admin", {
      event: "client_required",
      status: 403,
      userId: session.user.id,
    });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return session as Session;
}

/**
 * Return a JSON error response with the given message and status code.
 * Optionally log the error when status >= 500.
 */
export function apiError(message: string, status: number, err?: unknown): NextResponse {
  if (status >= 500) {
    logger.error(message, { event: "api_error", status, err });
  }
  return NextResponse.json({ error: message }, { status });
}
