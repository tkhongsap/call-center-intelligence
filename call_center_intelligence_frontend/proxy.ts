import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "@/src/i18n";

// Create the intl middleware for locale handling
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
});

// Get the API URL from environment (server-side)
const API_URL = process.env.INTERNAL_API_URL || "http://localhost:8000";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Handle API routes - proxy to backend
  if (pathname.startsWith("/api/")) {
    const backendUrl = `${API_URL}${pathname}${search}`;

    try {
      const response = await fetch(backendUrl, {
        method: request.method,
        headers: {
          ...Object.fromEntries(request.headers),
          host: new URL(API_URL).host,
        },
        body: request.method !== "GET" && request.method !== "HEAD"
          ? await request.text()
          : undefined,
      });

      // Create response with the same status, headers, and body
      const responseHeaders = new Headers(response.headers);
      // Remove headers that shouldn't be forwarded
      responseHeaders.delete("transfer-encoding");

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      console.error("Proxy error:", error);
      return NextResponse.json(
        { error: "Failed to proxy request to backend" },
        { status: 502 }
      );
    }
  }

  // Handle locale routing for non-API routes
  return intlMiddleware(request);
}

export const config = {
  // Match all routes except static files
  matcher: ["/((?!_next|.*\\..*).*)"],
};
