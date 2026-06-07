import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

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
        diagnostics.checks.d1Tables = result.results?.map(
          (r: any) => r.name,
        );
      } catch (dbErr: any) {
        diagnostics.checks.d1Query = `FAIL: ${dbErr.message}`;
      }
    } else {
      diagnostics.checks.d1Binding = "MISSING";
    }

    // Check 5: GEMINI_API_KEY
    if (context?.env?.GEMINI_API_KEY) {
      const key = context.env.GEMINI_API_KEY as string;
      diagnostics.checks.geminiKey = `SET (${key.length} chars, starts with: ${key.substring(0, 6)}...)`;
    } else {
      diagnostics.checks.geminiKey = "MISSING from context.env";
    }

    // Check 5b: process.env
    if (process.env.GEMINI_API_KEY) {
      diagnostics.checks.geminiKeyProcessEnv = `SET (${process.env.GEMINI_API_KEY.length} chars)`;
    } else {
      diagnostics.checks.geminiKeyProcessEnv = "MISSING from process.env";
    }

    // Check 6: Test Gemini API call
    try {
      let apiKey =
        (context?.env?.GEMINI_API_KEY as string) ||
        process.env.GEMINI_API_KEY;
      if (apiKey) {
        const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
        const testResponse = await fetch(testUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: 'Say "hello" in JSON: {"greeting":"hello"}' }] },
            ],
            generationConfig: {
              temperature: 0,
              responseMimeType: "application/json",
            },
          }),
        });
        const testText = await testResponse.text();
        diagnostics.checks.geminiApiCall = {
          status: testResponse.status,
          statusText: testResponse.statusText,
          body: testText.substring(0, 500),
        };
      } else {
        diagnostics.checks.geminiApiCall = "SKIPPED - no key available";
      }
    } catch (geminiErr: any) {
      diagnostics.checks.geminiApiCall = `FAIL: ${geminiErr.message}`;
    }
  } catch (ctxErr: any) {
    diagnostics.checks.requestContext = `FAIL: ${ctxErr.message}`;
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
