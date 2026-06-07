import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { corsHeaders } from "./lib/cors";

export function middleware(request: NextRequest) {
  // Handle preflight OPTIONS request
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Handle standard request response propagation
  const response = NextResponse.next();

  // Apply CORS headers to the response
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// Apply this middleware only to /api/ routes
export const config = {
  matcher: "/api/:path*",
};
