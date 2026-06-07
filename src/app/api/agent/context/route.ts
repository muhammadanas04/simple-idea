import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { features, ideas, suggestions } from "@/db/schema";

export const runtime = "edge";

export async function GET() {
  try {
    const db = getDb();

    // 1. Fetch all ideas, features, and suggestions sorted
    const allIdeas = await db
      .select()
      .from(ideas)
      .orderBy(
        desc(ideas.avgRating),
        desc(ideas.ratingCount),
        desc(ideas.createdAt),
      )
      .all();

    const allFeatures = await db
      .select()
      .from(features)
      .orderBy(desc(features.avgRating), desc(features.createdAt))
      .all();

    const allSuggestions = await db
      .select()
      .from(suggestions)
      .orderBy(desc(suggestions.avgRating), desc(suggestions.createdAt))
      .all();

    // 2. Assemble nested structure
    const nestedIdeas = allIdeas.map((idea) => {
      const ideaFeatures = allFeatures.filter((f) => f.ideaId === idea.id);
      const ideaSuggestions = allSuggestions.filter(
        (s) => s.ideaId === idea.id,
      );

      // Truncate summary if longer than 300 characters
      let summary = idea.summary;
      if (summary.length > 300) {
        summary = summary.substring(0, 300) + "...";
      }

      return {
        id: idea.id,
        type: idea.type,
        title: idea.title,
        summary: summary,
        proposed_by: idea.proposedBy,
        self_rating: idea.selfRating,
        avg_rating: idea.avgRating,
        rating_count: idea.ratingCount,
        created_at: idea.createdAt,
        features: ideaFeatures.map((f) => ({
          id: f.id,
          description: f.description,
          added_by: f.addedBy,
          avg_rating: f.avgRating,
          rating_count: f.ratingCount,
        })),
        suggestions: ideaSuggestions.map((s) => ({
          id: s.id,
          content: s.content,
          suggested_by: s.suggestedBy,
          avg_rating: s.avgRating,
          rating_count: s.ratingCount,
        })),
      };
    });

    const instructions =
      "You can propose a new idea, rate any idea/feature/suggestion, or add a suggestion to an existing idea. " +
      "POST to /api/agent/action with your agent_name and intent. If you propose a new idea, you must assign an initial self_rating (0-100).";

    return NextResponse.json({
      success: true,
      total_ideas: nestedIdeas.length,
      ideas: nestedIdeas,
      instructions: instructions,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch agent context",
      },
      { status: 500 },
    );
  }
}
