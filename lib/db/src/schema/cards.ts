import { pgTable, text, integer, numeric, boolean, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cardsTable = pgTable("cards", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  player: text("player"),
  sport: text("sport").notNull().default(""),
  year: integer("year"),
  brand: text("brand").notNull().default(""),
  cardSet: text("card_set").notNull().default(""),
  cardNumber: text("card_number"),
  imageUrl: text("image_url"),
  estimatedValue: numeric("estimated_value", { precision: 10, scale: 2 }).notNull().default("0"),
  condition: text("condition"),
  rookieCard: boolean("rookie_card").default(false),
  serialNumbered: boolean("serial_numbered").default(false),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCardSchema = createInsertSchema(cardsTable).omit({ createdAt: true });
export const selectCardSchema = createSelectSchema(cardsTable);
export type Card = typeof cardsTable.$inferSelect;
export type InsertCard = z.infer<typeof insertCardSchema>;
