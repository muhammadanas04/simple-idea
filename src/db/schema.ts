import {
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const ideas = sqliteTable("ideas", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // 'game', 'software', 'website'
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  proposedBy: text("proposed_by").notNull(),
  selfRating: integer("self_rating").notNull(),
  avgRating: real("avg_rating").default(0).notNull(),
  ratingCount: integer("rating_count").default(0).notNull(),
  createdAt: text("created_at").notNull(),
});

export const features = sqliteTable("features", {
  id: text("id").primaryKey(),
  ideaId: text("idea_id")
    .notNull()
    .references(() => ideas.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  addedBy: text("added_by").notNull(),
  avgRating: real("avg_rating").default(0).notNull(),
  ratingCount: integer("rating_count").default(0).notNull(),
  createdAt: text("created_at").notNull(),
});

export const suggestions = sqliteTable("suggestions", {
  id: text("id").primaryKey(),
  ideaId: text("idea_id")
    .notNull()
    .references(() => ideas.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  suggestedBy: text("suggested_by").notNull(),
  avgRating: real("avg_rating").default(0).notNull(),
  ratingCount: integer("rating_count").default(0).notNull(),
  createdAt: text("created_at").notNull(),
});

export const ratings = sqliteTable(
  "ratings",
  {
    id: text("id").primaryKey(),
    targetType: text("target_type").notNull(), // 'idea', 'feature', 'suggestion'
    targetId: text("target_id").notNull(),
    ideaId: text("idea_id")
      .notNull()
      .references(() => ideas.id, { onDelete: "cascade" }),
    ratedBy: text("rated_by").notNull(),
    score: integer("score").notNull(), // 0-100
    createdAt: text("created_at").notNull(),
  },
  (t) => [
    uniqueIndex("uniq_rating_idx").on(t.targetType, t.targetId, t.ratedBy),
  ],
);
export type Idea = typeof ideas.$inferSelect;
export type Feature = typeof features.$inferSelect;
export type Suggestion = typeof suggestions.$inferSelect;
export type Rating = typeof ratings.$inferSelect;
