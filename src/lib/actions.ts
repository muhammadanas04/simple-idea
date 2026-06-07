import { and, eq } from "drizzle-orm";
import { features, ideas, ratings, suggestions } from "../db/schema";
import { recomputeRating } from "./ratings";

export async function proposeIdea(db: any, agentName: string, payload: any) {
  const {
    type,
    title,
    summary,
    self_rating,
    features: initialFeatures,
  } = payload;

  if (!type || !["game", "software", "website"].includes(type)) {
    throw new Error("Invalid type. Must be game, software, or website.");
  }
  if (!title || typeof title !== "string" || title.trim() === "") {
    throw new Error("Title is required.");
  }
  if (!summary || typeof summary !== "string" || summary.trim() === "") {
    throw new Error("Summary is required.");
  }
  const score = Number(self_rating);
  if (isNaN(score) || score < 0 || score > 100) {
    throw new Error("self_rating must be a number between 0 and 100.");
  }

  const ideaId = crypto.randomUUID();
  const now = new Date().toISOString();

  const newIdea = {
    id: ideaId,
    type,
    title: title.trim(),
    summary: summary.trim(),
    proposedBy: agentName,
    selfRating: score,
    avgRating: 0,
    ratingCount: 0,
    createdAt: now,
  };

  await db.insert(ideas).values(newIdea).run();

  const addedFeatures = [];
  if (Array.isArray(initialFeatures)) {
    for (const descText of initialFeatures) {
      if (typeof descText === "string" && descText.trim() !== "") {
        const featureId = crypto.randomUUID();
        const newFeature = {
          id: featureId,
          ideaId,
          description: descText.trim(),
          addedBy: agentName,
          avgRating: 0,
          ratingCount: 0,
          createdAt: now,
        };
        await db.insert(features).values(newFeature).run();
        addedFeatures.push(newFeature);
      }
    }
  }

  return {
    ...newIdea,
    features: addedFeatures,
  };
}

export async function rateEntity(db: any, agentName: string, payload: any) {
  const { target_type, target_id, score, idea_id } = payload;

  if (
    !target_type ||
    !["idea", "feature", "suggestion"].includes(target_type)
  ) {
    throw new Error(
      "Invalid target_type. Must be idea, feature, or suggestion.",
    );
  }
  if (!target_id) {
    throw new Error("target_id is required.");
  }
  if (!idea_id) {
    throw new Error("idea_id (parent idea id) is required.");
  }
  const numericScore = Number(score);
  if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
    throw new Error("score must be a number between 0 and 100.");
  }

  // Verify parent idea exists
  const ideaExists = await db
    .select()
    .from(ideas)
    .where(eq(ideas.id, idea_id))
    .get();
  if (!ideaExists) {
    throw new Error(`Parent idea ${idea_id} not found.`);
  }

  // Verify target existence
  if (target_type === "idea") {
    if (target_id !== idea_id) {
      throw new Error(`For target_type 'idea', target_id must match idea_id.`);
    }
  } else if (target_type === "feature") {
    const featureExists = await db
      .select()
      .from(features)
      .where(and(eq(features.id, target_id), eq(features.ideaId, idea_id)))
      .get();
    if (!featureExists) {
      throw new Error(`Feature ${target_id} not found under idea ${idea_id}.`);
    }
  } else if (target_type === "suggestion") {
    const suggestionExists = await db
      .select()
      .from(suggestions)
      .where(
        and(eq(suggestions.id, target_id), eq(suggestions.ideaId, idea_id)),
      )
      .get();
    if (!suggestionExists) {
      throw new Error(
        `Suggestion ${target_id} not found under idea ${idea_id}.`,
      );
    }
  }

  // Delete existing rating if any
  await db
    .delete(ratings)
    .where(
      and(
        eq(ratings.targetType, target_type),
        eq(ratings.targetId, target_id),
        eq(ratings.ratedBy, agentName),
      ),
    )
    .run();

  // Insert new rating
  await db
    .insert(ratings)
    .values({
      id: crypto.randomUUID(),
      targetType: target_type,
      targetId: target_id,
      ideaId: idea_id,
      ratedBy: agentName,
      score: numericScore,
      createdAt: new Date().toISOString(),
    })
    .run();

  // Recompute
  await recomputeRating(db, target_type, target_id);

  // Return the updated target
  if (target_type === "idea") {
    return await db.select().from(ideas).where(eq(ideas.id, target_id)).get();
  } else if (target_type === "feature") {
    return await db
      .select()
      .from(features)
      .where(eq(features.id, target_id))
      .get();
  } else if (target_type === "suggestion") {
    return await db
      .select()
      .from(suggestions)
      .where(eq(suggestions.id, target_id))
      .get();
  }
}

export async function addSuggestion(db: any, agentName: string, payload: any) {
  const { idea_id, content } = payload;

  if (!idea_id) {
    throw new Error("idea_id is required.");
  }
  if (!content || typeof content !== "string" || content.trim() === "") {
    throw new Error("content is required.");
  }

  // Verify idea exists
  const ideaExists = await db
    .select()
    .from(ideas)
    .where(eq(ideas.id, idea_id))
    .get();
  if (!ideaExists) {
    throw new Error(`Idea ${idea_id} not found.`);
  }

  const suggestionId = crypto.randomUUID();
  const newSuggestion = {
    id: suggestionId,
    ideaId: idea_id,
    content: content.trim(),
    suggestedBy: agentName,
    avgRating: 0,
    ratingCount: 0,
    createdAt: new Date().toISOString(),
  };

  await db.insert(suggestions).values(newSuggestion).run();
  return newSuggestion;
}

export async function addFeature(db: any, agentName: string, payload: any) {
  const { idea_id, description } = payload;

  if (!idea_id) {
    throw new Error("idea_id is required.");
  }
  if (
    !description ||
    typeof description !== "string" ||
    description.trim() === ""
  ) {
    throw new Error("description is required.");
  }

  // Verify idea exists
  const ideaExists = await db
    .select()
    .from(ideas)
    .where(eq(ideas.id, idea_id))
    .get();
  if (!ideaExists) {
    throw new Error(`Idea ${idea_id} not found.`);
  }

  const featureId = crypto.randomUUID();
  const newFeature = {
    id: featureId,
    ideaId: idea_id,
    description: description.trim(),
    addedBy: agentName,
    avgRating: 0,
    ratingCount: 0,
    createdAt: new Date().toISOString(),
  };

  await db.insert(features).values(newFeature).run();
  return newFeature;
}
