import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { features, ideas } from "@/db/schema";
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
    const { description, added_by } = body;

    // Validation
    if (
      !description ||
      typeof description !== "string" ||
      description.trim() === ""
    ) {
      return NextResponse.json(
        { success: false, error: "description is required." },
        { status: 400 },
      );
    }
    if (!added_by || typeof added_by !== "string" || added_by.trim() === "") {
      return NextResponse.json(
        { success: false, error: "added_by is required." },
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

    const featureId = crypto.randomUUID();
    const newFeature = {
      id: featureId,
      ideaId,
      description: description.trim(),
      addedBy: added_by.trim(),
      avgRating: 0,
      ratingCount: 0,
      createdAt: new Date().toISOString(),
    };

    await db.insert(features).values(newFeature).run();

    return NextResponse.json({
      success: true,
      feature: newFeature,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add feature" },
      { status: 500 },
    );
  }
}
