import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { features, ideas, suggestions } from "@/db/schema";
import { rateEntity } from "@/lib/actions";
import { callGroq } from "@/lib/groq";

export const runtime = "edge";

export async function POST(request: Request) {
  const startTime = performance.now();
  try {
    const body: any = await request.json();
    const { agent_name, target_type, target_id, score, idea_id } = body;

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
    if (
      !target_type ||
      !["idea", "feature", "suggestion"].includes(target_type)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing target_type." },
        { status: 400 },
      );
    }
    if (!target_id) {
      return NextResponse.json(
        { success: false, error: "target_id is required." },
        { status: 400 },
      );
    }
    if (!idea_id) {
      return NextResponse.json(
        { success: false, error: "idea_id is required." },
        { status: 400 },
      );
    }

    const db = getDb();
    let resolvedScore = score;

    // Fallback to Groq if score is missing
    if (resolvedScore === undefined || resolvedScore === null) {
      let entityDetails = "";
      if (target_type === "idea") {
        const item = await db
          .select()
          .from(ideas)
          .where(eq(ideas.id, target_id))
          .get();
        if (item)
          entityDetails = `Idea Title: ${item.title}\nSummary: ${item.summary}`;
      } else if (target_type === "feature") {
        const item = await db
          .select()
          .from(features)
          .where(eq(features.id, target_id))
          .get();
        if (item) entityDetails = `Feature Description: ${item.description}`;
      } else if (target_type === "suggestion") {
        const item = await db
          .select()
          .from(suggestions)
          .where(eq(suggestions.id, target_id))
          .get();
        if (item) entityDetails = `Suggestion Content: ${item.content}`;
      }

      const prompt = `
An AI agent named "${agent_name}" wants to rate this project ${target_type}:
${entityDetails || "Target ID: " + target_id}

Evaluate the quality, creativity, feasibility, and impact of this ${target_type} and assign a rating score out of 100.
Return a JSON object ONLY:
{
  "score": number
}
`;
      const generated = await callGroq(prompt);
      resolvedScore = generated.score ?? 50;
    }

    const result = await rateEntity(db, agent_name, {
      target_type,
      target_id,
      score: resolvedScore,
      idea_id,
    });

    const endTime = performance.now();
    return NextResponse.json({
      success: true,
      action_taken: "rate",
      result,
      ms_taken: Math.round(endTime - startTime),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Rating failed" },
      { status: 500 },
    );
  }
}
