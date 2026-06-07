import { getRequestContext } from "@cloudflare/next-on-pages";
import { NextResponse } from "next/server";

export const runtime = "edge";

// Debug endpoint to diagnose deployment issues
export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    runtime: "edge",
    checks: {},
  };

  // Check 1: Basic edge runtime
  diagnostics.checks.edgeRuntime = "OK";

  // Check 2: Cloudflare request context
  try {
    const context = getRequestContext();
    diagnostics.checks.requestContext = context ? "OK" : "MISSING";

    // Check 3: D1 binding
    if (context?.env?.DB) {
      diagnostics.checks.d1Binding = "OK";

      // Check 4: D1 query
      try {
        const result = await context.env.DB.prepare(
          "SELECT name FROM sqlite_master WHERE type='table'",
        ).all();
        diagnostics.checks.d1Query = "OK";
        diagnostics.checks.d1Tables = result.results?.map((r: any) => r.name);
      } catch (dbErr: any) {
        diagnostics.checks.d1Query = `FAIL: ${dbErr.message}`;
      }
    } else {
      diagnostics.checks.d1Binding = "MISSING";
    }
  } catch (ctxErr: any) {
    diagnostics.checks.requestContext = `FAIL: ${ctxErr.message}`;
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
