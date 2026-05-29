import { auth } from "@/auth";

/**
 * Middleware for Next.js to handle authentication and role-based access control.
 * It intercepts requests and redirects users based on their authentication status and role.
 */
export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  // Define route categories
  const isPublicRoute = 
    nextUrl.pathname === "/" || 
    nextUrl.pathname.startsWith("/treatments/") || 
    nextUrl.pathname.startsWith("/physicians/") || 
    nextUrl.pathname === "/quiz" || 
    nextUrl.pathname === "/book" ||
    nextUrl.pathname.startsWith("/api/webhooks");
    
  const isAuthRoute = nextUrl.pathname === "/login";
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isPortalRoute = nextUrl.pathname.startsWith("/portal");

  // Handle authentication routes (e.g., /login)
  if (isAuthRoute) {
    if (isLoggedIn) {
      // Redirect authenticated users based on their role
      if (role === "DOCTOR" || role === "RECEPTIONIST") {
        return Response.redirect(new URL("/admin", nextUrl));
      }
      return Response.redirect(new URL("/portal/dashboard", nextUrl));
    }
    // Allow unauthenticated users to access auth routes
    return;
  }

  // Handle admin routes (e.g., /admin/*)
  if (isAdminRoute) {
    if (!isLoggedIn) {
      // Redirect unauthenticated users to login
      return Response.redirect(new URL("/login", nextUrl));
    }
    if (role !== "DOCTOR" && role !== "RECEPTIONIST") {
      // Restrict access for non-admin users
      return Response.redirect(new URL("/login", nextUrl));
    }
    // Allow access for doctors and receptionists
    return;
  }

  // Handle patient portal routes (e.g., /portal/*)
  if (isPortalRoute) {
    if (!isLoggedIn) {
      // Redirect unauthenticated users to login
      return Response.redirect(new URL("/login", nextUrl));
    }
    // Allow authenticated users to access portal routes
    return;
  }
});

/**
 * Configuration object to specify which routes the middleware should run on.
 * Excludes API routes, static files, images, and SVG files.
 */
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
