import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { ratings, suggestions } from "@/db/schema";
import { recomputeRating } from "@/lib/ratings";
import { corsHeaders } from "@/lib/cors";

export const runtime = "edge";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

type RouteContext = {
  params: Promise<{ id: string; sid: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: ideaId, sid: suggestionId } = await context.params;
    const body: any = await request.json();
    const { rated_by, score } = body;

    // Validation
    if (!rated_by || typeof rated_by !== "string" || rated_by.trim() === "") {
      return NextResponse.json(
        { success: false, error: "rated_by is required." },
        { status: 400 },
      );
    }
    const numericScore = Number(score);
    if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
      return NextResponse.json(
        { success: false, error: "score must be a number between 0 and 100." },
        { status: 400 },
      );
    }

    const db = getDb();

    // Check if suggestion exists
    const suggestionExists = await db
      .select()
      .from(suggestions)
      .where(
        and(eq(suggestions.id, suggestionId), eq(suggestions.ideaId, ideaId)),
      )
      .get();

    if (!suggestionExists) {
      return NextResponse.json(
        { success: false, error: "Suggestion not found under this idea" },
        { status: 404 },
      );
    }

    // Delete existing rating by this agent for this target if it exists
    await db
      .delete(ratings)
      .where(
        and(
          eq(ratings.targetType, "suggestion"),
          eq(ratings.targetId, suggestionId),
          eq(ratings.ratedBy, rated_by.trim()),
        ),
      )
      .run();

    // Insert new rating
    await db
      .insert(ratings)
      .values({
        id: crypto.randomUUID(),
        targetType: "suggestion",
        targetId: suggestionId,
        ideaId,
        ratedBy: rated_by.trim(),
        score: numericScore,
        createdAt: new Date().toISOString(),
      })
      .run();

    // Recompute ratings
    await recomputeRating(db, "suggestion", suggestionId);

    // Fetch updated suggestion to return
    const updatedSuggestion = await db
      .select()
      .from(suggestions)
      .where(eq(suggestions.id, suggestionId))
      .get();

    return NextResponse.json({
      success: true,
      message: "Suggestion rating submitted successfully",
      suggestion: updatedSuggestion,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to rate suggestion" },
      { status: 500 },
    );
  }
}
