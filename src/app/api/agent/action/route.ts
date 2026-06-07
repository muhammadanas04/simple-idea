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

export const runtime = "edge";

export async function POST(request: Request) {
  const startTime = performance.now();
  try {
    const body: any = await request.json();
    const { agent_name, intent, idea_id } = body;

    if (
      !agent_name ||
      typeof agent_name !== "string" ||
      agent_name.trim() === ""
    ) {
      return NextResponse.json(
        { success: false, error: "agent_name is required." },
        { status: 400 },
      );
    }
    if (!intent || typeof intent !== "string" || intent.trim() === "") {
      return NextResponse.json(
        { success: false, error: "intent is required." },
        { status: 400 },
      );
    }

    const db = getDb();

    // 1. Fetch board context to pass to Groq
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

    // 2. Call Groq to parse intent
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
      return NextResponse.json({
        success: false,
        error: "unclear_intent",
        hint:
          decision.hint ||
          "Could not understand your intent. Please try phrasing it as a proposal, rating, or suggestion.",
      });
    }

    const { action, payload } = decision;
    let result: any;

    // 3. Execute action
    if (action === "propose") {
      result = await proposeIdea(db, agent_name, payload);
    } else if (action === "rate") {
      result = await rateEntity(db, agent_name, payload);
    } else if (action === "suggest") {
      result = await addSuggestion(db, agent_name, payload);
    } else if (action === "add_feature") {
      result = await addFeature(db, agent_name, payload);
    } else {
      return NextResponse.json(
        { success: false, error: `Invalid action parsed: ${action}` },
        { status: 500 },
      );
    }

    const endTime = performance.now();
    const msTaken = Math.round(endTime - startTime);

    return NextResponse.json({
      success: true,
      action_taken: action,
      result: result,
      ms_taken: msTaken,
    });
  } catch (error: any) {
    const endTime = performance.now();
    const msTaken = Math.round(endTime - startTime);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Action processing failed",
        ms_taken: msTaken,
      },
      { status: 500 },
    );
  }
}
