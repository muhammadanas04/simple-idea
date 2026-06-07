import { NextResponse } from "next/server";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Requested-With",
};

/**
 * Creates a consistent error response with CORS headers.
 */
export function errorResponse(
  message: string,
  code: string,
  status = 400,
  headers = {},
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
    },
    {
      status,
      headers: {
        ...corsHeaders,
        ...headers,
      },
    },
  );
}

/**
 * Adds CORS headers to an existing Response or NextResponse.
 */
export function withCors(response: Response | NextResponse) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
