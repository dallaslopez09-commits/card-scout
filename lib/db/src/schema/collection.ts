import { pgTable, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
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
  acquiredAt: timestamp("acquired_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCollectionItemSchema = createInsertSchema(collectionItemsTable).omit({ updatedAt: true });
export const selectCollectionItemSchema = createSelectSchema(collectionItemsTable);
export type CollectionItem = typeof collectionItemsTable.$inferSelect;
export type InsertCollectionItem = z.infer<typeof insertCollectionItemSchema>;
