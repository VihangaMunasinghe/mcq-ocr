import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface TokenData {
  sub: string;
  user_id: string;
  role: string;
  faculty_id: string;
  verify_status: string;
}


const protectedRoutes = [
  "/dashboard",
  "/generate-template",
  "/marking-jobs",
  "/templates",
  "/users",
  "/settings",
  "/auth/not-verified",
];
const publicRoutes = ["/auth/signin", "/auth/register"];

const facultyAdminNotAllowedRoutes = ["/settings"];
const basicUserNotAllowedRoutes = facultyAdminNotAllowedRoutes.concat([
  "/users",
]);
const superAdminNotAllowedRoutes = ["/marking-jobs", "/templates"];

function checkAccess(
  pathname: string,
  payload: TokenData
): { allowed: boolean; redirect?: string } {
  // If payload is a string, we can't inspect claims; fail closed (deny)
  if (typeof payload === "string")
    return { allowed: false, redirect: "/auth/signin" };

  const role = (payload.role as string) ?? "";
  const verifyStatus = (payload.verify_status as string) ?? "none";

  const isAdminVerified = verifyStatus === "admin_verified";

  // If user isn't admin-verified, only allow not-verified page
  if (!isAdminVerified) {
    if (pathname.startsWith("/auth/not-verified")) return { allowed: true };
    return { allowed: false, redirect: "/auth/not-verified" };
  }

  // Role-based route restrictions
  const notAllowedMap: Record<string, string[]> = {
    "Super User": superAdminNotAllowedRoutes,
    "Faculty Admin": facultyAdminNotAllowedRoutes,
    "Basic User": basicUserNotAllowedRoutes,
  };

  const disallowed = (notAllowedMap[role] ?? []).some((route) =>
    pathname.startsWith(route)
  );

  if (disallowed) return { allowed: false, redirect: "/" };

  return { allowed: true };
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const accessToken = req.cookies.get("access_token")?.value;

  // If public route and already logged in
  if (publicRoutes.includes(pathname) && accessToken) {
    try {
      return NextResponse.redirect(new URL("/", req.url));
    } catch {
      // token expired — still redirect to dashboard after refresh
    }
  }

  // If protected route
  if (
    pathname === "/" ||
    protectedRoutes.some((route) => pathname.startsWith(route))
  ) {
    if (!accessToken) {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }

    try {
      const payload = JSON.parse(atob(accessToken.split(".")[1])) as TokenData;
      const { allowed, redirect } = checkAccess(pathname, payload);
      if (allowed) return NextResponse.next();
      return NextResponse.redirect(new URL(redirect ?? "/", req.url));
    } catch {
      // access token expired — try refreshing
      // if (refreshToken) {
      //   const refreshResponse = await fetch(
      //     `${process.env.BACKEND_URL}/api/auth/refresh`,
      //     {
      //       method: "POST",
      //       credentials: "include",
      //       headers: { cookie: `refresh_token=${refreshToken}` },
      //     }
      //   );

      //   if (refreshResponse.ok) {
      //     const newAccess = refreshResponse.headers
      //       .get("set-cookie")
      //       ?.match(/access_token=([^;]+)/)?.[1];
      //     const newRefresh = refreshResponse.headers
      //       .get("set-cookie")
      //       ?.match(/refresh_token=([^;]+)/)?.[1];
      //     if (newAccess || newRefresh) {
      //       const response = NextResponse.next();
      //       if (newAccess)
      //         response.cookies.set("access_token", newAccess, {
      //           httpOnly: true,
      //         });
      //       if (newRefresh)
      //         response.cookies.set("refresh_token", newRefresh, {
      //           httpOnly: true,
      //         });
      //       return response;
      //     }
      //   }
      // }
      // // If refresh failed
      // const res = NextResponse.redirect(new URL("/auth/signin", req.url));
      // res.cookies.delete("access_token");
      // res.cookies.delete("refresh_token");
      // return res;
    }
  }

  // Default
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"], // apply to all routes except assets
};
