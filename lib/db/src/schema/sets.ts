import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const setGoalsTable = pgTable("set_goals", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  setName: text("set_name").notNull(),       // e.g. "Fleer Basketball"
  brand: text("brand").notNull(),            // e.g. "Fleer"
  year: integer("year"),                     // e.g. 1986
  sport: text("sport"),                      // e.g. "Basketball"
  totalCards: integer("total_cards"),        // user-entered total (e.g. 132)
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSetGoalSchema = createInsertSchema(setGoalsTable);
export const selectSetGoalSchema = createSelectSchema(setGoalsTable);
export type SetGoal = typeof setGoalsTable.$inferSelect;
export type InsertSetGoal = z.infer<typeof insertSetGoalSchema>;
