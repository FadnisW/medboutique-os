import { auth } from "@/auth";

/**
 * Middleware for Next.js to handle authentication and role-based access control.
 * It intercepts requests and redirects users based on their authentication status and role.
 * Incorporates path normalization to prevent path-traversal/bypass attacks.
 */
export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  // Normalize path to prevent evasion attacks (e.g. double slashes, trailing slashes, uppercase bypass)
  const rawPath = nextUrl.pathname;
  let normalizedPath = rawPath.replace(/\/+/g, "/").toLowerCase();
  if (normalizedPath !== "/" && normalizedPath.endsWith("/")) {
    normalizedPath = normalizedPath.slice(0, -1);
  }

  // Whitelisted Public Routes (accessible without logging in)
  const isPublicRoute =
    normalizedPath === "" ||
    normalizedPath === "/" ||
    normalizedPath.startsWith("/treatments/") ||
    normalizedPath.startsWith("/physicians/") ||
    normalizedPath === "/quiz" ||
    normalizedPath === "/book" ||
    normalizedPath === "/api/webhooks" ||
    normalizedPath.startsWith("/api/webhooks/") ||
    normalizedPath === "/api/auth" ||
    normalizedPath.startsWith("/api/auth/");

  // Auth Routes
  const isAuthRoute = normalizedPath === "/login" || normalizedPath === "/register";

  // Restricted Route Categories
  const isAdminRoute = normalizedPath === "/admin" || normalizedPath.startsWith("/admin/");
  const isPortalRoute = normalizedPath === "/portal" || normalizedPath.startsWith("/portal/");

  // 1. Allow public routes unconditionally
  if (isPublicRoute) {
    return;
  }

  // 2. Handle login route (auth route)
  if (isAuthRoute) {
    if (isLoggedIn) {
      const redirectUrl = nextUrl.clone();
      // Redirect logged-in users to their corresponding dashboard
      if (role === "DOCTOR" || role === "RECEPTIONIST") {
        redirectUrl.pathname = "/admin";
        return Response.redirect(redirectUrl);
      }
      redirectUrl.pathname = "/portal/dashboard";
      return Response.redirect(redirectUrl);
    }
    return;
  }

  // 3. Default-Deny Policy: Require login for all other routes
  if (!isLoggedIn) {
    const redirectUrl = nextUrl.clone();
    redirectUrl.pathname = "/login";
    return Response.redirect(redirectUrl);
  }

  // 4. Enforce role-based access control (RBAC) on admin routes
  if (isAdminRoute) {
    if (role !== "DOCTOR" && role !== "RECEPTIONIST") {
      const redirectUrl = nextUrl.clone();
      redirectUrl.pathname = "/portal/dashboard";
      return Response.redirect(redirectUrl);
    }
  }

  // 5. Patient Portal routes require PATIENT, DOCTOR, or RECEPTIONIST (any authenticated user is fine)
  // However, DOCTOR and RECEPTIONIST should be redirected to their own dashboard
  if (isPortalRoute) {
    if (role === "DOCTOR" || role === "RECEPTIONIST") {
      const redirectUrl = nextUrl.clone();
      redirectUrl.pathname = "/admin";
      return Response.redirect(redirectUrl);
    }
    // Proceed for PATIENT
    return;
  }

  // Allow other authenticated requests (default fallback)
  return;
});

/**
 * Configuration object to specify which routes the proxy should run on.
 * Executes on all routes except static assets, favicon, etc.
 * Unlike previous configurations, it evaluates API endpoints (excluding auth) to prevent unauthorized API calls.
 */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
