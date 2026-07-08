// Must stay `middleware.ts` (edge runtime): the OpenNext Cloudflare adapter
// does not support Next 16's Node-runtime `proxy.ts` (workers-sdk#13755).
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip api routes, Next internals, and files with an extension (assets).
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
