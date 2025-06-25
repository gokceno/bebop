import { JSONResolver, JSONDefinition } from "graphql-scalars";
import { DateTime } from "luxon";
import { events } from "../schema";
import { db } from "../utils/db";
import { desc, asc, sql, SQL, count } from "drizzle-orm";
import type {
  GraphQLEventQueryArgs,
  GraphQLContext,
  Config,
  SQLCondition,
} from "../types";

// Function to generate dynamic parameter input types based on config
const generateParamInputTypes = (config: Config): string => {
  const paramInputs = config.eventTypes
    .map((eventType) => {
      const paramFields = eventType.params
        .map((paramObj) => {
          const paramName = Object.keys(paramObj)[0];
          const paramConfig = paramObj[paramName];
          const conditionType =
            paramConfig.type === "numeric"
              ? "NumberCondition"
              : "StringCondition";
          return `${paramName}: ${conditionType}`;
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

// Function to generate GraphQL enum for event types
const generateEventTypeEnum = (config: Config): string => {
  const enumValues = config.eventTypes
    .map((eventType) => {
      return `  ${eventType.type}`;
    })
    .join("\n");

  return `enum EventTypeEnum {\n${enumValues}\n}`;
};

export const createTypeDefs = (config: Config) => `
  ${JSONDefinition}

  ${generateEventTypeEnum(config)}

  ${generateParamInputTypes(config)}

  ${generateMainParamsInput(config)}

  input StringCondition {
    eq: String
    neq: String
  }

  input NumberCondition {
    eq: Int
    neq: Int
    gte: Int
    lte: Int
  }

  input EventWhereInput {
    email: StringCondition
    eventName: StringCondition
    eventType: EventTypeEnum
    createdAt: NumberCondition
    params: EventParamsInput
  }

  type EventsResponse {
    events: [Event]
    total: Int
  }

  type Query {
    me: String
    events(
      limit: Int = 50,
      offset: Int = 0,
      order: String = "desc",
      where: EventWhereInput
    ): EventsResponse
    eventTypes: [EventType]
  }

  type Event {
    id: ID
    eventName: String
    eventType: EventTypeEnum
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

  type EventType {
    type: String
    label: String
  }
`;

// Default typeDefs for backward compatibility
export const typeDefs = createTypeDefs({
  auth: { bearerTokens: [], jwt: { mode: "verify", secret: "", maxAge: "" } },
  eventTypes: [],
});

export const resolvers = {
  JSON: JSONResolver,
  Event: {
    createdAt: (parent: any) => DateTime.fromJSDate(parent.createdAt).toISO(),
    eventType: (parent: any) => parent.eventName,
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
    eventTypes: (_: any, __: any, context: GraphQLContext) => {
      return (
        context.config?.eventTypes?.map((eventType) => ({
          type: eventType.type,
          label: eventType.label,
        })) || []
      );
    },
    events: async (
      _: any,
      args: GraphQLEventQueryArgs,
      context: GraphQLContext
    ) => {
      const { limit = 50, offset = 0, order = "desc", where } = args;

      try {
        const orderFunc = order === "asc" ? asc : desc;
        const conditions: SQLCondition[] = [];

        // Handle email conditions
        if (where?.email) {
          if (where.email.eq) {
            conditions.push(
              sql`${events.originator}->>'Email' = ${where.email.eq}`
            );
          }
          if (where.email.neq) {
            conditions.push(
              sql`${events.originator}->>'Email' != ${where.email.neq}`
            );
          }
        }

        // Handle eventName conditions
        if (where?.eventName) {
          if (where.eventName.eq) {
            conditions.push(sql`${events.eventName} = ${where.eventName.eq}`);
          }
          if (where.eventName.neq) {
            conditions.push(sql`${events.eventName} != ${where.eventName.neq}`);
          }
        }

        // Handle eventType conditions
        if (where?.eventType) {
          conditions.push(sql`${events.eventName} = ${where.eventType}`);
        }

        // Handle createdAt conditions
        if (where?.createdAt) {
          if (where.createdAt.eq !== undefined) {
            conditions.push(sql`${events.createdAt} = ${where.createdAt.eq}`);
          }
          if (where.createdAt.neq !== undefined) {
            conditions.push(sql`${events.createdAt} != ${where.createdAt.neq}`);
          }
          if (where.createdAt.gte !== undefined) {
            conditions.push(sql`${events.createdAt} >= ${where.createdAt.gte}`);
          }
          if (where.createdAt.lte !== undefined) {
            conditions.push(sql`${events.createdAt} <= ${where.createdAt.lte}`);
          }
        }
        // Handle dynamic parameter filtering
        if (where?.params && context?.config) {
          const paramConditions: SQLCondition[] = [];

          // Iterate through each event type in params
          Object.keys(where.params).forEach((eventType) => {
            const eventParams = where.params![eventType];
            if (eventParams && Object.keys(eventParams).length > 0) {
              // For each parameter in this event type
              Object.keys(eventParams).forEach((paramName) => {
                const paramCondition = eventParams[paramName];
                if (paramCondition && typeof paramCondition === "object") {
                  // Handle eq condition
                  if (
                    paramCondition.eq !== undefined &&
                    paramCondition.eq !== null
                  ) {
                    paramConditions.push(
                      sql`EXISTS (
                        SELECT 1 FROM events_params ep
                        WHERE ep.event_id = ${events.id}
                        AND ep.param_name = ${paramName}
                        AND ep.param_value = ${paramCondition.eq.toString()}
                        AND ${events.eventName} = ${eventType}
                      )`
                    );
                  }
                  // Handle neq condition
                  if (
                    paramCondition.neq !== undefined &&
                    paramCondition.neq !== null
                  ) {
                    paramConditions.push(
                      sql`NOT EXISTS (
                        SELECT 1 FROM events_params ep
                        WHERE ep.event_id = ${events.id}
                        AND ep.param_name = ${paramName}
                        AND ep.param_value = ${paramCondition.neq.toString()}
                        AND ${events.eventName} = ${eventType}
                      )`
                    );
                  }
                  // Handle gte condition (for numeric params)
                  if (
                    "gte" in paramCondition &&
                    paramCondition.gte !== undefined &&
                    paramCondition.gte !== null
                  ) {
                    paramConditions.push(
                      sql`EXISTS (
                        SELECT 1 FROM events_params ep
                        WHERE ep.event_id = ${events.id}
                        AND ep.param_name = ${paramName}
                        AND CAST(ep.param_value AS REAL) >= ${paramCondition.gte}
                        AND ${events.eventName} = ${eventType}
                      )`
                    );
                  }
                  // Handle lte condition (for numeric params)
                  if (
                    "lte" in paramCondition &&
                    paramCondition.lte !== undefined &&
                    paramCondition.lte !== null
                  ) {
                    paramConditions.push(
                      sql`EXISTS (
                        SELECT 1 FROM events_params ep
                        WHERE ep.event_id = ${events.id}
                        AND ep.param_name = ${paramName}
                        AND CAST(ep.param_value AS REAL) <= ${paramCondition.lte}
                        AND ${events.eventName} = ${eventType}
                      )`
                    );
                  }
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

        const whereClause: SQLCondition | undefined =
          conditions.length > 0
            ? conditions.reduce((acc, condition, index) =>
                index === 0 ? condition : sql`${acc} AND ${condition}`
              )
            : undefined;

        // Get total count with same where conditions but without limit/offset
        const totalCountResult = await db
          ?.select({ count: count() })
          .from(events)
          .where(whereClause);

        const totalCount = totalCountResult?.[0]?.count || 0;

        // Get paginated results
        const eventResults =
          (await db?.query.events.findMany({
            limit,
            offset,
            with: {
              params: true,
              traces: true,
            },
            where: whereClause,
            orderBy: () => [orderFunc(events.createdAt)],
          })) || [];

        return {
          events: eventResults,
          total: totalCount,
        };
      } catch (error) {
        context.logger?.error("Error fetching events:", error);
        throw new Error("Failed to fetch events");
      }
    },
  },
};
