import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { proposeIdea } from "@/lib/actions";
import { callGroq } from "@/lib/groq";

export const runtime = "edge";

export async function POST(request: Request) {
  const startTime = performance.now();
  try {
    const body: any = await request.json();
    const { agent_name, type, title, summary, self_rating, features, topic } =
      body;

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

    let resolvedType = type || "game";
    let resolvedTitle = title;
    let resolvedSummary = summary;
    let resolvedSelfRating = self_rating;
    let resolvedFeatures = features;

    // Fallback to Groq if title or summary is missing
    if (!resolvedTitle || !resolvedSummary) {
      const prompt = `
An AI agent named "${agent_name}" wants to propose a concept.
Here is the input they provided:
Topic: ${topic || ""}
Type: ${resolvedType}
Title: ${resolvedTitle || ""}
Summary: ${resolvedSummary || ""}
Self-Rating: ${resolvedSelfRating || ""}
Features: ${JSON.stringify(resolvedFeatures || [])}

Generate a complete project concept. Fill in missing details:
- type: must be 'game', 'software', or 'website'.
- title: a catchy 2-5 word title.
- summary: a clear 1-3 sentence overview.
- self_rating: an integer between 0 and 100 representing your assessment of the idea's initial quality.
- features: a string array containing 2 to 4 key features.

Return a JSON object ONLY:
{
  "type": "game" | "software" | "website",
  "title": "...",
  "summary": "...",
  "self_rating": number,
  "features": ["feature 1", "feature 2", ...]
}
`;
      const generated = await callGroq(prompt);
      resolvedType = generated.type || resolvedType;
      resolvedTitle = generated.title;
      resolvedSummary = generated.summary;
      resolvedSelfRating = generated.self_rating ?? 50;
      resolvedFeatures = generated.features || resolvedFeatures;
    } else if (
      resolvedSelfRating === undefined ||
      resolvedSelfRating === null
    ) {
      // If title/summary are present but self_rating is missing, evaluate it
      const prompt = `
An AI agent named "${agent_name}" proposed a concept:
Title: ${resolvedTitle}
Summary: ${resolvedSummary}
Type: ${resolvedType}

Assign a self_rating (0-100) to this concept representing its strength.
Return a JSON object ONLY:
{
  "self_rating": number
}
`;
      const generated = await callGroq(prompt);
      resolvedSelfRating = generated.self_rating ?? 50;
    }

    const db = getDb();
    const result = await proposeIdea(db, agent_name, {
      type: resolvedType,
      title: resolvedTitle,
      summary: resolvedSummary,
      self_rating: resolvedSelfRating,
      features: resolvedFeatures,
    });

    const endTime = performance.now();
    return NextResponse.json({
      success: true,
      action_taken: "propose",
      result,
      ms_taken: Math.round(endTime - startTime),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Propose failed" },
      { status: 500 },
    );
  }
}
