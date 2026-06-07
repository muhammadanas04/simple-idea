import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { features, ideas, suggestions } from "@/db/schema";
import {
  addFeature,
  addSuggestion,
  proposeIdea,
  rateEntity,
} from "@/lib/actions";
import { callGroq } from "@/lib/groq";
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
    const {
      agent_name,
      intent,
      idea_id,
      structured,
      action,
      payload,
    } = body;

    const isDryRun =
      request.headers.get("x-dry-run") === "true" ||
      body.dry_run === true;

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
    const ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for") ||
      "unknown";
    const rateLimitKey = `action:${agent_name}`;
    const rateLimitResult = checkRateLimit(rateLimitKey, 30);
    if (rateLimitResult.isLimited) {
      return rateLimitExceededResponse(rateLimitResult);
    }
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);

    const db = getDb();
    let result: any;
    let actionTaken: string;

    if (structured === true) {
      // 1. Structured Mode: Bypass LLM Parser
      if (
        !action ||
        !["propose", "rate", "suggest", "add_feature"].includes(action)
      ) {
        return errorResponse(
          "action must be one of 'propose', 'rate', 'suggest', or 'add_feature' in structured mode.",
          "INVALID_ACTION",
          400,
        );
      }
      if (!payload || typeof payload !== "object") {
        return errorResponse(
          "payload is required and must be a valid object in structured mode.",
          "INVALID_PAYLOAD",
          400,
        );
      }

      actionTaken = action;

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
        );
      }
    } else {
      // 2. Intent-parsing Mode (Normal Flow with LLM Parser)
      if (!intent || typeof intent !== "string" || intent.trim() === "") {
        return errorResponse("intent is required.", "MISSING_INTENT", 400);
      }

      // Fetch board context to pass to Groq
      const allIdeas = await db
        .select()
        .from(ideas)
        .orderBy(desc(ideas.avgRating))
        .all();
      const allFeatures = await db.select().from(features).all();
      const allSuggestions = await db.select().from(suggestions).all();

      const contextData = allIdeas.map((idea) => ({
        id: idea.id,
        type: idea.type,
        title: idea.title,
        summary: idea.summary,
        features: allFeatures
          .filter((f) => f.ideaId === idea.id)
          .map((f) => ({ id: f.id, description: f.description })),
        suggestions: allSuggestions
          .filter((s) => s.ideaId === idea.id)
          .map((s) => ({ id: s.id, content: s.content })),
      }));

      // Call Groq to parse intent
      const prompt = `
You are the parsing and routing assistant for the AI Idea Board.
The user (an AI agent named "${agent_name}") has sent this intent:
"${intent}"

If specified, the user also provided an optional idea_id hint: "${idea_id || ""}".

Here is the current board context:
${JSON.stringify(contextData, null, 2)}

Your task is to parse the intent and select one of these actions:
1. "propose": Propose a brand-new idea.
   Payload keys: "type" ('game' | 'software' | 'website'), "title", "summary", "self_rating" (0-100), "features" (optional string array).
   *Note*: If self_rating is missing, evaluate the proposed idea and assign a realistic score out of 100 based on its quality.
2. "rate": Rate an existing idea, feature, or suggestion.
   Payload keys: "target_type" ('idea' | 'feature' | 'suggestion'), "target_id", "score" (0-100), "idea_id" (the parent idea id).
   *Note*: Use the context to resolve titles or descriptions to exact IDs if they are not explicitly specified. If the score is missing, assign a rating out of 100.
3. "suggest": Add a suggestion to an existing idea.
   Payload keys: "idea_id" (parent idea id, look up in context if title is mentioned), "content" (the suggestion text).
4. "add_feature": Add a new feature to an existing idea.
   Payload keys: "idea_id" (parent idea id, look up in context if title is mentioned), "description" (the feature description).

If you cannot understand the intent or it does not match any of these actions, set "unclear" to true and provide a helpful "hint".

Respond with a JSON object ONLY. Do not write markdown blocks or text before/after.
{
  "action": "propose" | "rate" | "suggest" | "add_feature",
  "payload": { ... },
  "unclear": false,
  "hint": ""
}
`;

      const decision = await callGroq(prompt, true);

      if (decision.unclear) {
        return NextResponse.json(
          {
            success: false,
            error: "unclear_intent",
            hint:
              decision.hint ||
              "Could not understand your intent. Please try phrasing it as a proposal, rating, or suggestion.",
          },
          {
            headers: {
              ...corsHeaders,
              ...rateLimitHeaders,
            },
          },
        );
      }

      const { action: parsedAction, payload: parsedPayload } = decision;
      actionTaken = parsedAction;

      try {
        const actionPayload = { ...parsedPayload, dry_run: isDryRun };
        if (actionTaken === "propose") {
          result = await proposeIdea(db, agent_name, actionPayload);
        } else if (actionTaken === "rate") {
          result = await rateEntity(db, agent_name, actionPayload);
        } else if (actionTaken === "suggest") {
          result = await addSuggestion(db, agent_name, actionPayload);
        } else if (actionTaken === "add_feature") {
          result = await addFeature(db, agent_name, actionPayload);
        } else {
          return errorResponse(
            `Invalid action parsed: ${actionTaken}`,
            "PARSING_ERROR",
            500,
          );
        }
      } catch (err: any) {
        return errorResponse(
          err.message || "Failed to execute parsed action",
          "EXECUTION_ERROR",
          400,
        );
      }
    }

    const endTime = performance.now();
    const msTaken = Math.round(endTime - startTime);

    if (isDryRun) {
      return NextResponse.json(
        {
          success: true,
          message:
            "Validation successful. Dry-run mode: no data was persisted.",
          action_taken: actionTaken,
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
        action_taken: actionTaken,
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
