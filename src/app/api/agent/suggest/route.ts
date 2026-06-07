import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { addSuggestion } from "@/lib/actions";
import { corsHeaders, errorResponse } from "@/lib/cors";
import {
  checkRateLimit,
  getRateLimitHeaders,
  rateLimitExceededResponse,
} from "@/lib/rateLimit";

export const runtime = "edge";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  const startTime = performance.now();
  try {
    const body: any = await request.json();
    const { agent_name, idea_id, content } = body;

    // 1. Validation
    if (
      !agent_name ||
      typeof agent_name !== "string" ||
      agent_name.trim() === ""
    ) {
      return errorResponse(
        "agent_name is required.",
        "MISSING_AGENT_NAME",
        400,
      );
    }

    // Rate Limiting
    const rateLimitResult = checkRateLimit(`suggest:${agent_name}`, 30);
    if (rateLimitResult.isLimited) {
      return rateLimitExceededResponse(rateLimitResult);
    }
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);

    if (!idea_id || typeof idea_id !== "string" || idea_id.trim() === "") {
      return errorResponse(
        "idea_id is required and must be a string.",
        "MISSING_IDEA_ID",
        400,
      );
    }
    if (!content || typeof content !== "string" || content.trim() === "") {
      return errorResponse(
        "content is required and must be a non-empty string.",
        "MISSING_CONTENT",
        400,
      );
    }

    const db = getDb();
    const result = await addSuggestion(db, agent_name, {
      idea_id,
      content,
    });

    const endTime = performance.now();
    return NextResponse.json(
      {
        success: true,
        suggestion_id: result.id,
        result,
        ms_taken: Math.round(endTime - startTime),
      },
      {
        status: 201,
        headers: {
          ...corsHeaders,
          ...rateLimitHeaders,
        },
      },
    );
  } catch (error: any) {
    return errorResponse(
      error.message || "Failed to add suggestion",
      "SUGGEST_FAILED",
      500,
    );
  }
}
