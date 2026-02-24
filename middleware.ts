import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPaths = [
  "/today",
  "/dashboard",
  "/results",
  "/programs",
  "/progress",
  "/account",
  "/tasks",
  "/inbox",
  "/coaching",
  "/admin",
];

function isProtected(pathname: string): boolean {
  return protectedPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isAdminRoute(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isLoggedIn = !!token;
  const isAdmin = token?.role === "admin";

  if (isProtected(pathname) && !isLoggedIn) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (isAdminRoute(pathname) && isLoggedIn && !isAdmin) {
    return NextResponse.redirect(new URL("/today", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/today/:path*",
    "/dashboard/:path*",
    "/results/:path*",
    "/programs/:path*",
    "/progress/:path*",
    "/account/:path*",
    "/tasks/:path*",
    "/inbox/:path*",
    "/coaching/:path*",
    "/admin/:path*",
  ],
};
