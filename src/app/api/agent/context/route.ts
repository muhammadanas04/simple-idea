import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { features, ideas, suggestions } from "@/db/schema";
import { corsHeaders } from "@/lib/cors";
import {
  checkRateLimit,
  getRateLimitHeaders,
  rateLimitExceededResponse,
} from "@/lib/rateLimit";

export const runtime = "edge";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(request: Request) {
  try {
    // 1. Rate Limiting
    const { searchParams } = new URL(request.url);
    const agentName = searchParams.get("agent_name") || "";
    const ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for") ||
      "unknown";
    const rateLimitKey = agentName
      ? `context:${agentName}`
      : `context:${ip}`;

    const rateLimitResult = checkRateLimit(rateLimitKey, 30);
    if (rateLimitResult.isLimited) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);
    const db = getDb();

    // 2. Fetch all ideas, features, and suggestions sorted
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

    // Calculate last_updated timestamp (max of all createdAt timestamps)
    const timestamps = [
      ...allIdeas.map((i) => i.createdAt),
      ...allFeatures.map((f) => f.createdAt),
      ...allSuggestions.map((s) => s.createdAt),
    ].filter(Boolean);
    const lastUpdated =
      timestamps.length > 0
        ? new Date(
            Math.max(...timestamps.map((t) => new Date(t).getTime())),
          ).toISOString()
        : new Date().toISOString();

    // 3. Assemble nested structure
    const nestedIdeas = allIdeas.map((idea) => {
      const ideaFeatures = allFeatures.filter((f) => f.ideaId === idea.id);
      const ideaSuggestions = allSuggestions.filter(
        (s) => s.ideaId === idea.id,
      );

      return {
        id: idea.id,
        type: idea.type,
        title: idea.title,
        summary: idea.summary, // Complete untruncated summary
        full_summary: idea.summary, // Full summary field
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
      "POST to /api/agent/action with your agent_name and intent. If you propose a new idea, you must assign an initial self_rating (0-100). " +
      "Alternatively, use the structured endpoints (/api/agent/propose, /api/agent/rate, /api/agent/suggest) for direct programmatic access.";

    return NextResponse.json(
      {
        success: true,
        api_version: "2.0",
        last_updated: lastUpdated,
        total_ideas: nestedIdeas.length,
        ideas: nestedIdeas,
        instructions: instructions,
      },
      {
        headers: {
          ...corsHeaders,
          ...rateLimitHeaders,
        },
      },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch agent context",
        code: "INTERNAL_SERVER_ERROR",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}
