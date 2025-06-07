import { JSONResolver, JSONDefinition } from "graphql-scalars";
import { DateTime } from "luxon";
import { events } from "../schema";
import { db } from "../utils/db";
import { desc, asc, sql, SQL } from "drizzle-orm";
import type { GraphQLEventQueryArgs, GraphQLContext, Config } from "../types";

// Function to generate dynamic parameter input types based on config
const generateParamInputTypes = (config: Config): string => {
  const paramInputs = config.eventTypes
    .map((eventType) => {
      const paramFields = eventType.params
        .map((paramObj) => {
          const paramName = Object.keys(paramObj)[0];
          const paramType = paramObj[paramName];
          const graphqlType = paramType === "numeric" ? "Float" : "String";
          return `${paramName}: ${graphqlType}`;
        })
        .join("\n");

      if (paramFields) {
        return `input ${eventType.type}ParamsInput {\n${paramFields}\n  }`;
      }
      return "";
    })
    .filter(Boolean);

  return paramInputs.join("\n\n");
};

// Function to generate the main params input with all event type params
const generateMainParamsInput = (config: Config): string => {
  const eventTypeFields = config.eventTypes
    .map((eventType) => {
      return `${eventType.type}: ${eventType.type}ParamsInput`;
    })
    .join("\n");

  return `input EventParamsInput {\n${eventTypeFields}\n  }`;
};

export const createTypeDefs = (config: Config) => `
  ${JSONDefinition}

  ${generateParamInputTypes(config)}

  ${generateMainParamsInput(config)}

  input EventWhereInput {
    email: String
    eventName: String
    params: EventParamsInput
  }

  type Query {
    me: String
    events(
      limit: Int = 50,
      offset: Int = 0,
      order: String = "desc",
      where: EventWhereInput
    ): [Event]
  }

  type Event {
    id: ID
    eventName: String
    originator: JSON
    createdAt: String
    params: [EventParam]
    traces: [EventTrace]
  }

  type EventParam {
    id: ID
    eventId: String
    paramName: String
    paramValue: String
    createdAt: String
  }

  type EventTrace {
    id: ID
    eventId: String
    traceData: JSON
    createdAt: String
  }
`;

// Default typeDefs for backward compatibility
export const typeDefs = createTypeDefs({
  auth: { bearerTokens: [], jwt: { secret: "", maxAge: "" } },
  eventTypes: [],
});

export const resolvers = {
  JSON: JSONResolver,
  Event: {
    createdAt: (parent: any) => DateTime.fromJSDate(parent.createdAt).toISO(),
  },
  EventParam: {
    createdAt: (parent: any) => DateTime.fromJSDate(parent.createdAt).toISO(),
  },
  EventTrace: {
    createdAt: (parent: any) => DateTime.fromJSDate(parent.createdAt).toISO(),
  },
  Query: {
    me: (_: any, __: any, context: GraphQLContext) => {
      return context.jwtPayload?.Email || null;
    },
    events: async (
      _: any,
      args: GraphQLEventQueryArgs,
      context: GraphQLContext
    ) => {
      const { limit = 50, offset = 0, order = "desc", where } = args;

      try {
        const orderFunc = order === "asc" ? asc : desc;
        const conditions = [];

        if (where?.email) {
          conditions.push(sql`${events.originator}->>'Email' = ${where.email}`);
        }
        if (where?.eventName) {
          conditions.push(sql`${events.eventName} = ${where.eventName}`);
        }

        // Handle dynamic parameter filtering
        if (where?.params && context?.config) {
          const paramConditions: SQL[] = [];

          // Iterate through each event type in params
          Object.keys(where.params).forEach((eventType) => {
            const eventParams = (where.params as any)[eventType];
            if (eventParams && Object.keys(eventParams).length > 0) {
              // For each parameter in this event type
              Object.keys(eventParams).forEach((paramName) => {
                const paramValue = eventParams[paramName];
                if (paramValue !== undefined && paramValue !== null) {
                  // Create a condition that checks both the event name and parameter
                  paramConditions.push(
                    sql`EXISTS (
                      SELECT 1 FROM events_params ep
                      WHERE ep.event_id = ${events.id}
                      AND ep.param_name = ${paramName}
                      AND ep.param_value = ${paramValue.toString()}
                      AND ${events.eventName} = ${eventType}
                    )`
                  );
                }
              });
            }
          });

          if (paramConditions.length > 0) {
            conditions.push(
              paramConditions.reduce((acc, condition, index) =>
                index === 0 ? condition : sql`${acc} AND ${condition}`
              )
            );
          }
        }

        const whereClause =
          conditions.length > 0
            ? conditions.reduce((acc, condition, index) =>
                index === 0 ? condition : sql`${acc} AND ${condition}`
              )
            : undefined;

        return (
          (await db?.query.events.findMany({
            limit,
            offset,
            with: {
              params: true,
              traces: true,
            },
            where: whereClause,
            orderBy: () => [orderFunc(events.createdAt)],
          })) || []
        );
      } catch (error) {
        context.logger?.error("Error fetching events:", error);
        throw new Error("Failed to fetch events");
      }
    },
  },
};
