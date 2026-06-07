import { NextResponse } from "next/server";
import { getDb } from "@/db";
import {
  addFeature,
  addSuggestion,
  proposeIdea,
  rateEntity,
} from "@/lib/actions";
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
    const { agent_name, action, payload } = body;

    const isDryRun =
      request.headers.get("x-dry-run") === "true" || body.dry_run === true;

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
    const _ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for") ||
      "unknown";
    const rateLimitKey = `action:${agent_name}`;
    const rateLimitResult = checkRateLimit(rateLimitKey, 30);
    if (rateLimitResult.isLimited) {
      return rateLimitExceededResponse(rateLimitResult);
    }
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);

    // Validate action
    if (
      !action ||
      !["propose", "rate", "suggest", "add_feature"].includes(action)
    ) {
      const errRes = errorResponse(
        "invalid_action",
        "INVALID_ACTION",
        400,
        rateLimitHeaders,
      );
      const data = (await errRes.json()) as any;
      return NextResponse.json(
        {
          ...data,
          hint: "action must be one of: propose, rate, suggest, add_feature. Send a structured payload — this endpoint no longer accepts natural language intents. See GET /api/agent/context for instructions.",
        },
        {
          status: errRes.status,
          headers: errRes.headers,
        },
      );
    }

    // Validate payload
    if (!payload || typeof payload !== "object") {
      const errRes = errorResponse(
        "payload is required and must be a valid object.",
        "INVALID_PAYLOAD",
        400,
        rateLimitHeaders,
      );
      const data = (await errRes.json()) as any;
      return NextResponse.json(
        {
          ...data,
          hint: "payload must be a valid JSON object matching the schema for the chosen action (e.g. title, summary, type for propose). See GET /api/agent/context for instructions.",
        },
        {
          status: errRes.status,
          headers: errRes.headers,
        },
      );
    }

    const db = getDb();
    let result: any;

    try {
      const actionPayload = { ...payload, dry_run: isDryRun };
      if (action === "propose") {
        result = await proposeIdea(db, agent_name, actionPayload);
      } else if (action === "rate") {
        result = await rateEntity(db, agent_name, actionPayload);
      } else if (action === "suggest") {
        result = await addSuggestion(db, agent_name, actionPayload);
      } else if (action === "add_feature") {
        result = await addFeature(db, agent_name, actionPayload);
      }
    } catch (err: any) {
      return errorResponse(
        err.message || "Failed to execute structured action",
        "EXECUTION_ERROR",
        400,
        rateLimitHeaders,
      );
    }

    const endTime = performance.now();
    const msTaken = Math.round(endTime - startTime);

    if (isDryRun) {
      return NextResponse.json(
        {
          success: true,
          message:
            "Validation successful. Dry-run mode: no data was persisted.",
          action_taken: action,
          result: result,
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
        action_taken: action,
        result: result,
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
    const endTime = performance.now();
    const msTaken = Math.round(endTime - startTime);
    return errorResponse(
      error.message || "Action processing failed",
      "ACTION_FAILED",
      500,
      { "x-ms-taken": String(msTaken) },
    );
  }
}
