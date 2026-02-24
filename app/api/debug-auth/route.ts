import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Debug endpoint to see why login might not persist on Vercel.
 * Call GET /api/debug-auth after attempting login.
 *
 * Returns:
 * - hasSession: whether the server sees a session (cookie was set and read)
 * - env: which auth env vars are set (values never returned)
 *
 * Only enabled when DEBUG_AUTH=1 or NODE_ENV=development.
 */
export async function GET() {
  const allow =
    process.env.DEBUG_AUTH === "1" || process.env.NODE_ENV === "development";
  if (!allow) {
    return NextResponse.json({ error: "Not enabled" }, { status: 404 });
  }

  const session = await auth();
  return NextResponse.json({
    hasSession: !!session?.user,
    userId: session?.user?.id ?? null,
    role: session?.user?.role ?? null,
    env: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      isHttps: process.env.NEXTAUTH_URL?.startsWith("https:"),
    },
  });
}
