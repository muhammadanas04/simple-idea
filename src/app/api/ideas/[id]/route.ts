import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { features, ideas, suggestions } from "@/db/schema";
import { corsHeaders } from "@/lib/cors";

export const runtime = "edge";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const db = getDb();

    // 1. Fetch the idea
    const ideaResult = await db
      .select()
      .from(ideas)
      .where(eq(ideas.id, id))
      .get();

    if (!ideaResult) {
      return NextResponse.json(
        { success: false, error: "Idea not found" },
        { status: 404 },
      );
    }

    // 2. Fetch features
    const ideaFeatures = await db
      .select()
      .from(features)
      .where(eq(features.ideaId, id))
      .orderBy(desc(features.avgRating), desc(features.createdAt))
      .all();

    // 3. Fetch suggestions
    const ideaSuggestions = await db
      .select()
      .from(suggestions)
      .where(eq(suggestions.ideaId, id))
      .orderBy(desc(suggestions.avgRating), desc(suggestions.createdAt))
      .all();

    return NextResponse.json({
      success: true,
      idea: {
        ...ideaResult,
        features: ideaFeatures,
        suggestions: ideaSuggestions,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch idea details",
      },
      { status: 500 },
    );
  }
}
