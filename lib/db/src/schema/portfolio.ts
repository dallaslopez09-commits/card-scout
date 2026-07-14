import { pgTable, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const portfolioSnapshotsTable = pgTable("portfolio_snapshots", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  totalValue: numeric("total_value", { precision: 10, scale: 2 }).notNull().default("0"),
  totalCost: numeric("total_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  snapshotDate: timestamp("snapshot_date").defaultNow().notNull(),
});

export const insertPortfolioSnapshotSchema = createInsertSchema(portfolioSnapshotsTable);
export const selectPortfolioSnapshotSchema = createSelectSchema(portfolioSnapshotsTable);
export type PortfolioSnapshot = typeof portfolioSnapshotsTable.$inferSelect;
export type InsertPortfolioSnapshot = z.infer<typeof insertPortfolioSnapshotSchema>;
