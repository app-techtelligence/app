// Must stay `middleware.ts` (edge runtime): the OpenNext Cloudflare adapter
// does not support Next 16's Node-runtime `proxy.ts`.
import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

// External (localized) pathnames reachable without a session.
const PUBLIC_PATHS = new Set([
  "/",
  "/entrar",
  "/login",
  "/criar-conta",
  "/signup",
  "/verifique-seu-email",
  "/verify-email",
]);

// Logged-in users get bounced away from the auth pages.
const AUTH_PATHS = new Set(["/entrar", "/login", "/criar-conta", "/signup"]);

export default async function middleware(request: NextRequest) {
  // 1. Locale detection / redirects / rewrites.
  const response = intlMiddleware(request);

  // 2. Refresh the Supabase session, writing rotated cookies onto the
  //    outgoing response (standard @supabase/ssr middleware pattern).
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 3. Route protection (also enforced per-page — defense in depth).
  const pathname = request.nextUrl.pathname;
  const isEn = pathname === "/en" || pathname.startsWith("/en/");
  const stripped = (isEn ? pathname.slice(3) : pathname) || "/";

  if (!user && !PUBLIC_PATHS.has(stripped)) {
    const login = isEn ? "/en/login" : "/entrar";
    return NextResponse.redirect(new URL(login, request.url));
  }
  if (user && AUTH_PATHS.has(stripped)) {
    const dashboard = isEn ? "/en/dashboard" : "/painel";
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  return response;
}

export const config = {
  // Skip api routes, the auth confirm handler, Next internals, and files.
  matcher: "/((?!api|auth|_next|_vercel|.*\\..*).*)",
};
