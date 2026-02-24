export { auth as middleware } from "@/lib/auth-edge";

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
