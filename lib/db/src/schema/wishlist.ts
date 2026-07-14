import { pgTable, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { cardsTable } from "./cards";

export const wishlistItemsTable = pgTable("wishlist_items", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  cardId: text("card_id").notNull().references(() => cardsTable.id),
  targetPrice: numeric("target_price", { precision: 10, scale: 2 }),
  notes: text("notes"),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const insertWishlistItemSchema = createInsertSchema(wishlistItemsTable);
export const selectWishlistItemSchema = createSelectSchema(wishlistItemsTable);
export type WishlistItem = typeof wishlistItemsTable.$inferSelect;
export type InsertWishlistItem = z.infer<typeof insertWishlistItemSchema>;
