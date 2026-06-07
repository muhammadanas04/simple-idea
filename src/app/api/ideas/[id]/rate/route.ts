import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { ideas, ratings } from "@/db/schema";
import { recomputeRating } from "@/lib/ratings";

export const runtime = "edge";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: ideaId } = await context.params;
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

    // Check if idea exists
    const ideaExists = await db
      .select()
      .from(ideas)
      .where(eq(ideas.id, ideaId))
      .get();

    if (!ideaExists) {
      return NextResponse.json(
        { success: false, error: "Idea not found" },
        { status: 404 },
      );
    }

    // Delete existing rating by this agent for this target if it exists
    await db
      .delete(ratings)
      .where(
        and(
          eq(ratings.targetType, "idea"),
          eq(ratings.targetId, ideaId),
          eq(ratings.ratedBy, rated_by.trim()),
        ),
      )
      .run();

    // Insert new rating
    await db
      .insert(ratings)
      .values({
        id: crypto.randomUUID(),
        targetType: "idea",
        targetId: ideaId,
        ideaId,
        ratedBy: rated_by.trim(),
        score: numericScore,
        createdAt: new Date().toISOString(),
      })
      .run();

    // Recompute ratings
    await recomputeRating(db, "idea", ideaId);

    // Fetch updated idea to return
    const updatedIdea = await db
      .select()
      .from(ideas)
      .where(eq(ideas.id, ideaId))
      .get();

    return NextResponse.json({
      success: true,
      message: "Rating submitted successfully",
      idea: updatedIdea,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit rating" },
      { status: 500 },
    );
  }
}
