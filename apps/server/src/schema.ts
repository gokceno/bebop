import { sqliteTable, text, int } from "drizzle-orm/sqlite-core";
import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";

export const events = sqliteTable("events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  eventName: text("event_name"),
  originator: text("originator", { mode: "json" }),
  createdAt: int("created_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
});

export const eventsParams = sqliteTable("events_params", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  eventId: text("event_id"),
  paramName: text("param_name"),
  paramValue: text("param_value"),
  createdAt: int("created_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
});

export const eventsTraces = sqliteTable("events_traces", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  eventId: text("event_id"),
  traceData: text("trace_data", { mode: "json" }),
  createdAt: int("created_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
});

export const eventsRelations = relations(events, ({ many }) => ({
  params: many(eventsParams),
  traces: many(eventsTraces),
}));

export const eventsParamsRelations = relations(eventsParams, ({ one }) => ({
  event: one(events, {
    fields: [eventsParams.eventId],
    references: [events.id],
  }),
}));

export const eventsTracesRelations = relations(eventsTraces, ({ one }) => ({
  event: one(events, {
    fields: [eventsTraces.eventId],
    references: [events.id],
  }),
}));
