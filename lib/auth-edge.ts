/**
 * Minimal NextAuth config for Edge middleware only.
 * No providers (no Prisma/bcrypt) so the bundle stays under Vercel's 1 MB Edge limit.
 * Session is read from the JWT cookie set by the full auth (lib/auth.ts) at login.
 */
import NextAuth from "next-auth";

export const { auth } = NextAuth({
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    authorized({ auth: session, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!session?.user;
      const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";
      const isAdminRoute = pathname.startsWith("/admin");
      const isClientProtected =
        pathname.startsWith("/today") ||
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/results") ||
        pathname.startsWith("/programs") ||
        pathname.startsWith("/progress") ||
        pathname.startsWith("/account") ||
        pathname.startsWith("/tasks") ||
        pathname.startsWith("/inbox") ||
        pathname.startsWith("/coaching");
      const isProtected = isAdminRoute || isClientProtected;
      if (isProtected && !isLoggedIn) return false;
      if (isAdminRoute && isLoggedIn && !isAdmin) {
        return Response.redirect(new URL("/today", request.nextUrl));
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
});
