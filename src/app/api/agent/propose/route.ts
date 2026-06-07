import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { proposeIdea } from "@/lib/actions";
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
    const { agent_name, title, summary, type, features, self_rating } = body;

    const isDryRun =
      request.headers.get("x-dry-run") === "true" ||
      body.dry_run === true;

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
    const rateLimitResult = checkRateLimit(`propose:${agent_name}`, 30);
    if (rateLimitResult.isLimited) {
      return rateLimitExceededResponse(rateLimitResult);
    }
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);

    if (!title || typeof title !== "string" || title.trim() === "") {
      return errorResponse("title is required.", "MISSING_TITLE", 400);
    }
    if (!summary || typeof summary !== "string" || summary.trim() === "") {
      return errorResponse("summary is required.", "MISSING_SUMMARY", 400);
    }
    if (!type || !["game", "software", "website"].includes(type)) {
      return errorResponse(
        "type must be one of: game, software, website.",
        "INVALID_TYPE",
        400,
      );
    }
    const score = Number(self_rating);
    if (
      self_rating === undefined ||
      self_rating === null ||
      isNaN(score) ||
      score < 0 ||
      score > 100
    ) {
      return errorResponse(
        "self_rating must be a number between 0 and 100.",
        "INVALID_SELF_RATING",
        400,
      );
    }
    if (features !== undefined && !Array.isArray(features)) {
      return errorResponse(
        "features must be an array of strings if provided.",
        "INVALID_FEATURES",
        400,
      );
    }

    const db = getDb();
    const result = await proposeIdea(db, agent_name, {
      type,
      title,
      summary,
      self_rating: score,
      features,
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
        idea_id: result.id,
        result,
        ms_taken: msTaken,
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
      error.message || "Failed to propose idea",
      "PROPOSE_FAILED",
      500,
    );
  }
}
