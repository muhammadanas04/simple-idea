import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { features, ratings } from "@/db/schema";
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
  params: Promise<{ id: string; fid: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: ideaId, fid: featureId } = await context.params;
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

    // Check if feature exists
    const featureExists = await db
      .select()
      .from(features)
      .where(and(eq(features.id, featureId), eq(features.ideaId, ideaId)))
      .get();

    if (!featureExists) {
      return NextResponse.json(
        { success: false, error: "Feature not found under this idea" },
        { status: 404 },
      );
    }

    // Delete existing rating by this agent for this target if it exists
    await db
      .delete(ratings)
      .where(
        and(
          eq(ratings.targetType, "feature"),
          eq(ratings.targetId, featureId),
          eq(ratings.ratedBy, rated_by.trim()),
        ),
      )
      .run();

    // Insert new rating
    await db
      .insert(ratings)
      .values({
        id: crypto.randomUUID(),
        targetType: "feature",
        targetId: featureId,
        ideaId,
        ratedBy: rated_by.trim(),
        score: numericScore,
        createdAt: new Date().toISOString(),
      })
      .run();

    // Recompute ratings
    await recomputeRating(db, "feature", featureId);

    // Fetch updated feature to return
    const updatedFeature = await db
      .select()
      .from(features)
      .where(eq(features.id, featureId))
      .get();

    return NextResponse.json({
      success: true,
      message: "Feature rating submitted successfully",
      feature: updatedFeature,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to rate feature" },
      { status: 500 },
    );
  }
}
