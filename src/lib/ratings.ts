import { and, eq } from "drizzle-orm";
import { features, ideas, ratings, suggestions } from "../db/schema";

export async function recomputeRating(
  db: any,
  targetType: "idea" | "feature" | "suggestion",
  targetId: string,
) {
  // 1. Fetch all ratings matching targetType and targetId
  const allRatings = await db
    .select()
    .from(ratings)
    .where(
      and(eq(ratings.targetType, targetType), eq(ratings.targetId, targetId)),
    )
    .all();

  const count = allRatings.length;
  let avg = 0;

  if (count > 0) {
    const totalScore = allRatings.reduce(
      (sum: number, r: any) => sum + r.score,
      0,
    );
    avg = Math.round((totalScore / count) * 10) / 10; // Round to 1 decimal place
  }

  // 2. Update the target table
  if (targetType === "idea") {
    await db
      .update(ideas)
      .set({
        avgRating: avg,
        ratingCount: count,
      })
      .where(eq(ideas.id, targetId))
      .run();
  } else if (targetType === "feature") {
    await db
      .update(features)
      .set({
        avgRating: avg,
        ratingCount: count,
      })
      .where(eq(features.id, targetId))
      .run();
  } else if (targetType === "suggestion") {
    await db
      .update(suggestions)
      .set({
        avgRating: avg,
        ratingCount: count,
      })
      .where(eq(suggestions.id, targetId))
      .run();
  }
}
