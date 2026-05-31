import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Match paths under /dashboard and /admin to enforce authentication
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/admin(.*)"
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    "/((?!_next|[^?]*\\.(?:html|css|js|gif|svg|png|jpeg|jpg|webp|woff|woff2|ico|csv|docx|xlsx|zip|webmanifest)).*)",
    // Ensure auth runs for API routes if any are in frontend (like trpc/proxies)
    "/(api|trpc)(.*)",
  ],
};
