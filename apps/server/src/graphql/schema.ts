import { JSONResolver, JSONDefinition } from "graphql-scalars";
import { DateTime } from "luxon";
import { db } from "../utils/db";
import { events } from "../schema";
import { desc, asc } from "drizzle-orm";

export const typeDefs = `
  ${JSONDefinition}
  type Query {
    me: String
    events(limit: Int = 50, offset: Int = 0, orderBy: String = "createdAt", orderDirection: String = "desc"): [Event]
  }

  type Event {
    id: ID
    eventName: String
    originator: JSON
    createdAt: String
  }
`;

export const resolvers = {
  JSON: JSONResolver,
  Event: {
    createdAt: (parent: any) => DateTime.fromJSDate(parent.createdAt).toISO(),
  },
  Query: {
    me: (_: any, __: any, context: any) => {
      return context.jwtPayload?.Email || null;
    },
    events: async (
      _: any,
      args: {
        limit?: number;
        offset?: number;
        orderBy?: string;
        orderDirection?: string;
      },
      context: any
    ) => {
      const {
        limit = 50,
        offset = 0,
        orderBy = "createdAt",
        orderDirection = "desc",
      } = args;

      // Ensure limit doesn't exceed 100
      const finalLimit = Math.min(limit, 100);

      // Determine sort order
      const orderField =
        orderBy === "eventName" ? events.eventName : events.createdAt;
      const orderFunc = orderDirection === "asc" ? asc : desc;

      try {
        const result = await db
          .select()
          .from(events)
          .orderBy(orderFunc(orderField))
          .limit(finalLimit)
          .offset(offset);

        return result;
      } catch (error) {
        context.logger?.error("Error fetching events:", error);
        throw new Error("Failed to fetch events");
      }
    },
  },
};
