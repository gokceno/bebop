import { sqliteTable, text, int } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const codes = sqliteTable("codes", {
  id: int("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull(),
  vendorName: text("vendor_name").notNull(),
  vendorUrl: text("vendor_url").notNull(),
  giftedTo: text("gifted_to"),
  giftedAt: int("gifted_at", { mode: "timestamp" }),
  createdAt: int("created_at", { mode: "timestamp" }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
});
