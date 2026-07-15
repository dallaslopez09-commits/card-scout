import { pgTable, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { collectionItemsTable } from "./collection";

export const cardPriceHistoryTable = pgTable("card_price_history", {
  id: text("id").primaryKey(),
  collectionItemId: text("collection_item_id").notNull().references(() => collectionItemsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  source: text("source").notNull(), // "acquired" | "ebay" | "manual"
  note: text("note"),               // optional label, e.g. "eBay median from 8 sold comps"
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export const insertCardPriceHistorySchema = createInsertSchema(cardPriceHistoryTable);
export const selectCardPriceHistorySchema = createSelectSchema(cardPriceHistoryTable);
export type CardPriceHistory = typeof cardPriceHistoryTable.$inferSelect;
export type InsertCardPriceHistory = z.infer<typeof insertCardPriceHistorySchema>;
