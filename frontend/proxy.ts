import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Middleware for authentication and routing (LEAN RBAC VERSION)
 *
 * IMPORTANT: This middleware only handles token validation and redirects.
 * Permission checks (module access, object permissions) happen in components
 * using the usePermissions() hook, which loads the full permission manifest
 * once on mount and provides instant checks without API calls.
 *
 * This approach is faster than checking permissions in middleware, as it:
 * 1. Avoids API calls on every navigation (reduces latency)
 * 2. Caches permissions in memory for instant checks
 * 3. Allows fine-grained UI control (hide buttons, disable fields, etc.)
 */
export function proxy(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  // Auth pages (login, register)
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Protected pages (require authentication)
  const isProtectedPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/leads") ||
    pathname.startsWith("/contacts") ||
    pathname.startsWith("/accounts") ||
    pathname.startsWith("/opportunities") ||
    pathname.startsWith("/activities") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/catalog") ||
    pathname.startsWith("/proposals") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/user-activities") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/settings");

  // Redirect to login if accessing protected page without token
  if (isProtectedPage && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect to dashboard if accessing auth page with token
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect root path based on auth status
  if (pathname === "/") {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Allow request to proceed
  // Permission checks will happen in components via usePermissions() hook
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/dashboard/:path*",
    "/leads/:path*",
    "/contacts/:path*",
    "/accounts/:path*",
    "/opportunities/:path*",
    "/activities/:path*",
    "/products/:path*",
    "/catalog/:path*",
    "/proposals/:path*",
    "/analytics/:path*",
    "/user-activities/:path*",
    "/admin/:path*",
    "/settings/:path*",
  ],
};
