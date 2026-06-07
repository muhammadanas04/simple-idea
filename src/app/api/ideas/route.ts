import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { features, ideas } from "@/db/schema";

export const runtime = "edge";

// GET /api/ideas - Fetch all ideas, sorted by avgRating DESC
export async function GET() {
  try {
    const db = getDb();
    const allIdeas = await db
      .select()
      .from(ideas)
      .orderBy(
        desc(ideas.avgRating),
        desc(ideas.ratingCount),
        desc(ideas.createdAt),
      )
      .all();

    return NextResponse.json({ success: true, ideas: allIdeas });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch ideas" },
      { status: 500 },
    );
  }
}

// POST /api/ideas - Submit a new idea
export async function POST(request: Request) {
  try {
    const body: any = await request.json();
    const {
      type,
      title,
      summary,
      proposed_by,
      self_rating,
      features: initialFeatures,
    } = body;

    // Validation
    if (!type || !["game", "software", "website"].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or missing type. Must be game, software, or website.",
        },
        { status: 400 },
      );
    }
    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Title is required." },
        { status: 400 },
      );
    }
    if (!summary || typeof summary !== "string" || summary.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Summary is required." },
        { status: 400 },
      );
    }
    if (
      !proposed_by ||
      typeof proposed_by !== "string" ||
      proposed_by.trim() === ""
    ) {
      return NextResponse.json(
        { success: false, error: "proposed_by is required." },
        { status: 400 },
      );
    }
    const score = Number(self_rating);
    if (isNaN(score) || score < 0 || score > 100) {
      return NextResponse.json(
        {
          success: false,
          error: "self_rating must be a number between 0 and 100.",
        },
        { status: 400 },
      );
    }

    const db = getDb();
    const ideaId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Insert idea
    const newIdea = {
      id: ideaId,
      type,
      title: title.trim(),
      summary: summary.trim(),
      proposedBy: proposed_by.trim(),
      selfRating: score,
      avgRating: 0,
      ratingCount: 0,
      createdAt: now,
    };

    await db.insert(ideas).values(newIdea).run();

    // Insert optional initial features
    const addedFeatures = [];
    if (Array.isArray(initialFeatures)) {
      for (const descText of initialFeatures) {
        if (typeof descText === "string" && descText.trim() !== "") {
          const featureId = crypto.randomUUID();
          const newFeature = {
            id: featureId,
            ideaId,
            description: descText.trim(),
            addedBy: proposed_by.trim(),
            avgRating: 0,
            ratingCount: 0,
            createdAt: now,
          };
          await db.insert(features).values(newFeature).run();
          addedFeatures.push(newFeature);
        }
      }
    }

    return NextResponse.json({
      success: true,
      idea: {
        ...newIdea,
        features: addedFeatures,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create idea" },
      { status: 500 },
    );
  }
}
