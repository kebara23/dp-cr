import { NextResponse, type NextRequest } from "next/server";

const hasClerkKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "placeholder";

function buildMiddleware() {
  if (!hasClerkKey) {
    return function noopMiddleware() {
      return NextResponse.next();
    };
  }

  const { clerkMiddleware, createRouteMatcher } = require("@clerk/nextjs/server");
  const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
  const isClientRoute = createRouteMatcher(["/cliente(.*)"]);

  return clerkMiddleware(async (auth: any, req: NextRequest) => {
    if (isAdminRoute(req)) {
      await auth.protect();
    }
    if (isClientRoute(req)) {
      await auth.protect();
    }
  });
}

export default buildMiddleware();

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
