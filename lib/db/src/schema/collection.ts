import { pgTable, text, integer, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { cardsTable } from "./cards";

export const collectionItemsTable = pgTable("collection_items", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  cardId: text("card_id").notNull().references(() => cardsTable.id),
  purchasePrice: numeric("purchase_price", { precision: 10, scale: 2 }).notNull().default("0"),
  currentValue: numeric("current_value", { precision: 10, scale: 2 }).notNull().default("0"),
  quantity: integer("quantity").notNull().default(1),
  condition: text("condition"),
  notes: text("notes"),
  // Fee tracking for true cost basis
  gradingFee: numeric("grading_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  shippingFee: numeric("shipping_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  otherFees: numeric("other_fees", { precision: 10, scale: 2 }).notNull().default("0"),
  // eBay market data
  ebayPrice: numeric("ebay_price", { precision: 10, scale: 2 }),
  ebayCheckedAt: timestamp("ebay_checked_at"),
  ebayListingUrl: text("ebay_listing_url"),
  // Card-specific image (overrides card.imageUrl)
  imageUrl: text("image_url"),
  acquiredAt: timestamp("acquired_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCollectionItemSchema = createInsertSchema(collectionItemsTable).omit({ updatedAt: true });
export const selectCollectionItemSchema = createSelectSchema(collectionItemsTable);
export type CollectionItem = typeof collectionItemsTable.$inferSelect;
export type InsertCollectionItem = z.infer<typeof insertCollectionItemSchema>;
