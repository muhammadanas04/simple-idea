import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { ideas, suggestions } from "@/db/schema";
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

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: ideaId } = await context.params;
    const body: any = await request.json();
    const { content, suggested_by } = body;

    // Validation
    if (!content || typeof content !== "string" || content.trim() === "") {
      return NextResponse.json(
        { success: false, error: "content is required." },
        { status: 400 },
      );
    }
    if (
      !suggested_by ||
      typeof suggested_by !== "string" ||
      suggested_by.trim() === ""
    ) {
      return NextResponse.json(
        { success: false, error: "suggested_by is required." },
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

    const suggestionId = crypto.randomUUID();
    const newSuggestion = {
      id: suggestionId,
      ideaId,
      content: content.trim(),
      suggestedBy: suggested_by.trim(),
      avgRating: 0,
      ratingCount: 0,
      createdAt: new Date().toISOString(),
    };

    await db.insert(suggestions).values(newSuggestion).run();

    return NextResponse.json({
      success: true,
      suggestion: newSuggestion,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add suggestion" },
      { status: 500 },
    );
  }
}
