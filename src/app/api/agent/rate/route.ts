import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { rateEntity } from "@/lib/actions";
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
    const { agent_name, target_type, target_id, score, idea_id } = body;

    const isDryRun =
      request.headers.get("x-dry-run") === "true" || body.dry_run === true;

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
    const rateLimitResult = checkRateLimit(`rate:${agent_name}`, 30);
    if (rateLimitResult.isLimited) {
      return rateLimitExceededResponse(rateLimitResult);
    }
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);

    if (
      !target_type ||
      !["idea", "feature", "suggestion"].includes(target_type)
    ) {
      return errorResponse(
        "target_type must be one of: idea, feature, suggestion.",
        "INVALID_TARGET_TYPE",
        400,
        rateLimitHeaders,
      );
    }
    if (
      !target_id ||
      typeof target_id !== "string" ||
      target_id.trim() === ""
    ) {
      return errorResponse(
        "target_id is required and must be a string.",
        "MISSING_TARGET_ID",
        400,
        rateLimitHeaders,
      );
    }
    if (!idea_id || typeof idea_id !== "string" || idea_id.trim() === "") {
      return errorResponse(
        "idea_id (parent idea id) is required and must be a string.",
        "MISSING_IDEA_ID",
        400,
        rateLimitHeaders,
      );
    }

    const numericScore = Number(score);
    if (
      score === undefined ||
      score === null ||
      Number.isNaN(numericScore) ||
      numericScore < 0 ||
      numericScore > 100
    ) {
      return errorResponse(
        "score is required and must be a number between 0 and 100.",
        "INVALID_SCORE",
        400,
        rateLimitHeaders,
      );
    }

    const db = getDb();
    const result = await rateEntity(db, agent_name, {
      target_type,
      target_id,
      score: numericScore,
      idea_id,
      dry_run: isDryRun,
    });

    const endTime = performance.now();
    const msTaken = Math.round(endTime - startTime);

    if (isDryRun) {
      return NextResponse.json(
        {
          success: true,
          message:
            "Validation successful. Dry-run mode: no data was persisted.",
          result,
          ms_taken: msTaken,
        },
        {
          status: 200,
          headers: {
            ...corsHeaders,
            ...rateLimitHeaders,
          },
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        result,
        ms_taken: msTaken,
      },
      {
        headers: {
          ...corsHeaders,
          ...rateLimitHeaders,
        },
      },
    );
  } catch (error: any) {
    return errorResponse(
      error.message || "Failed to rate entity",
      "RATE_FAILED",
      500,
    );
  }
}
