import { JSONResolver, JSONDefinition } from "graphql-scalars";
import { DateTime } from "luxon";
import { events, eventsClaims } from "../schema";
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

// Function to generate flattened params input for multi-event queries
const generateFlatParamsInput = (config: Config): string => {
  const paramMap = new Map<string, { type: string }>();

  // Collect all unique parameters across all event types
  config.eventTypes.forEach((eventType) => {
    eventType.params.forEach((paramObj) => {
      const paramName = Object.keys(paramObj)[0];
      const paramConfig = paramObj[paramName];
      if (!paramMap.has(paramName)) {
        paramMap.set(paramName, { type: paramConfig.type });
      }
    });
  });

  const paramFields = Array.from(paramMap.entries())
    .map(([paramName, paramConfig]) => {
      const conditionType =
        paramConfig.type === "numeric" ? "NumberCondition" : "StringCondition";
      return `  ${paramName}: ${conditionType}`;
    })
    .join("\n");

  if (paramFields) {
    return `input EventParamsFlatInput {\n${paramFields}\n}`;
  }

  return `input EventParamsFlatInput {\n  _placeholder: String\n}`;
};

// Function to generate claim input types based on config claims
const generateClaimInputTypes = (claimNames: string[]): string => {
  if (claimNames.length === 0) {
    return `input EventClaimsInput {\n  _placeholder: String\n}`;
  }

  const claimFields = claimNames
    .filter((claimName) => claimName && claimName.trim().length > 0)
    .map((claimName) => {
      return `  ${claimName}: StringCondition`;
    })
    .join("\n");

  return `input EventClaimsInput {\n${claimFields}\n}`;
};

// Function to generate Me type based on config claims
const generateMeType = (claimNames: string[]): string => {
  if (claimNames.length === 0) {
    return `type Me {\n  _placeholder: String\n}`;
  }

  const claimFields = claimNames
    .filter((claimName) => claimName && claimName.trim().length > 0)
    .map((claimName) => {
      return `  ${claimName}: String`;
    })
    .join("\n");

  return `type Me {\n${claimFields}\n}`;
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

  ${generateFlatParamsInput(config)}

  ${generateClaimInputTypes(config.auth.jwt.claims || [])}

  ${generateMeType(config.auth.jwt.claims || [])}

  input StringCondition {
    eq: String
    neq: String
    in: [String!]
  }

  input NumberCondition {
    eq: Int
    neq: Int
    gte: Int
    lte: Int
  }

  input EventWhereInput {
    eventName: StringCondition
    eventType: EventTypeEnum
    createdAt: NumberCondition
    params: EventParamsInput
    paramsFlat: EventParamsFlatInput
    claims: EventClaimsInput
  }

  type EventsResponse {
    events: [Event]
    total: Int
  }

  type Query {
    me: Me
    events(
      limit: Int = 50,
      offset: Int = 0,
      order: String = "desc",
      where: EventWhereInput
    ): EventsResponse
    eventTypes: [EventType]
    parameters: [Parameter]
    claimTypes: [ClaimType]
  }

  type Subscription {
    eventsStream: Event
  }

  type Event {
    id: ID
    eventName: String
    eventType: EventTypeEnum
    createdAt: String
    params: [EventParam]
    traces: [EventTrace]
    claims: [EventClaim]
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

  type EventClaim {
    id: ID
    eventId: String
    claimName: String
    claimValue: String
    createdAt: String
  }

  type EventType {
    type: String
    label: String
    params: [EventTypeParam]
  }

  type EventTypeParam {
    name: String
    type: String
    label: String
  }

  type Parameter {
    name: String
    label: String
    type: String
    eventTypes: [String]
  }

  type ClaimType {
    name: String
  }
`;

// Function to create typeDefs with claims from config
export const createDynamicTypeDefs = (config: Config): string => {
  return createTypeDefs(config);
};

// Default typeDefs for backward compatibility
export const typeDefs = createTypeDefs({
  auth: {
    bearerTokens: [],
    jwt: { mode: "verify", secret: "", maxAge: "", claims: [] },
  },
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
  EventClaim: {
    createdAt: (parent: any) => DateTime.fromJSDate(parent.createdAt).toISO(),
  },
  Query: {
    me: (_: any, __: any, context: GraphQLContext) => {
      if (!context.jwtPayload) {
        return null;
      }

      // Return an object with all claims from the JWT payload
      const claimNames = context.config?.auth.jwt.claims || [];
      const result: { [key: string]: string | null } = {};

      claimNames.forEach((claimName) => {
        result[claimName] = context.jwtPayload?.[claimName] || null;
      });

      return result;
    },
    eventTypes: (_: any, __: any, context: GraphQLContext) => {
      return (
        context.config?.eventTypes?.map((eventType) => ({
          type: eventType.type,
          label: eventType.label,
          params: eventType.params.map((paramObj) => {
            const paramName = Object.keys(paramObj)[0];
            const paramConfig = paramObj[paramName];
            return {
              name: paramName,
              type: paramConfig.type,
              label: paramConfig.label,
            };
          }),
        })) || []
      );
    },
    parameters: (_: any, __: any, context: GraphQLContext) => {
      if (!context.config?.eventTypes) {
        return [];
      }

      const paramMap = new Map<
        string,
        {
          name: string;
          label: string;
          type: string;
          eventTypes: Set<string>;
        }
      >();

      // Collect all parameters across event types
      context.config.eventTypes.forEach((eventType) => {
        eventType.params.forEach((paramObj) => {
          const paramName = Object.keys(paramObj)[0];
          const paramConfig = paramObj[paramName];

          if (paramMap.has(paramName)) {
            paramMap.get(paramName)!.eventTypes.add(eventType.type);
          } else {
            paramMap.set(paramName, {
              name: paramName,
              label: paramConfig.label,
              type: paramConfig.type,
              eventTypes: new Set([eventType.type]),
            });
          }
        });
      });

      // Convert to array and sort by parameter name
      return Array.from(paramMap.values())
        .map((param) => ({
          name: param.name,
          label: param.label,
          type: param.type,
          eventTypes: Array.from(param.eventTypes).sort(),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
    claimTypes: (_: any, __: any, context: GraphQLContext) => {
      const claimNames = context.config?.auth.jwt.claims || [];
      return claimNames.map((claimName) => ({ name: claimName }));
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

        // Handle eventName conditions
        if (where?.eventName) {
          if (where.eventName.eq) {
            conditions.push(sql`${events.eventName} = ${where.eventName.eq}`);
          }
          if (where.eventName.neq) {
            conditions.push(sql`${events.eventName} != ${where.eventName.neq}`);
          }
          if (
            where.eventName.in &&
            Array.isArray(where.eventName.in) &&
            where.eventName.in.length > 0
          ) {
            const inConditions = where.eventName.in.map(
              (val) => sql`${events.eventName} = ${val}`
            );
            conditions.push(
              inConditions.reduce((acc, condition, index) =>
                index === 0 ? condition : sql`${acc} OR ${condition}`
              )
            );
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

        // Handle claims conditions
        if (where?.claims) {
          const claimsConditions: SQLCondition[] = [];

          Object.keys(where.claims).forEach((claimName) => {
            const claimCondition = where.claims![claimName];
            if (claimCondition && typeof claimCondition === "object") {
              // Handle eq condition
              if (
                claimCondition.eq !== undefined &&
                claimCondition.eq !== null
              ) {
                claimsConditions.push(
                  sql`EXISTS (
                    SELECT 1 FROM events_claims ec
                    WHERE ec.event_id = ${events.id}
                    AND ec.claim_name = ${claimName}
                    AND ec.claim_value = ${claimCondition.eq.toString()}
                  )`
                );
              }
              // Handle neq condition
              if (
                claimCondition.neq !== undefined &&
                claimCondition.neq !== null
              ) {
                claimsConditions.push(
                  sql`NOT EXISTS (
                    SELECT 1 FROM events_claims ec
                    WHERE ec.event_id = ${events.id}
                    AND ec.claim_name = ${claimName}
                    AND ec.claim_value = ${claimCondition.neq.toString()}
                  )`
                );
              }
            }
          });

          if (claimsConditions.length > 0) {
            conditions.push(
              claimsConditions.reduce((acc, condition, index) =>
                index === 0 ? condition : sql`${acc} AND ${condition}`
              )
            );
          }
        }

        // Handle dynamic parameter filtering
        if (where?.params && context?.config) {
          // Optimized: Use JOIN with aggregation instead of correlated subqueries
          Object.keys(where.params).forEach((eventType) => {
            const eventParams = where.params![eventType];
            if (eventParams && Object.keys(eventParams).length > 0) {
              const paramOrConditions: SQLCondition[] = [];
              const eqParamNames: string[] = [];
              const neqConditions: SQLCondition[] = [];

              Object.keys(eventParams).forEach((paramName) => {
                const paramCondition = eventParams[paramName];
                if (paramCondition && typeof paramCondition === "object") {
                  // Handle eq condition - collect for GROUP BY/HAVING
                  if (
                    paramCondition.eq !== undefined &&
                    paramCondition.eq !== null
                  ) {
                    paramOrConditions.push(
                      sql`(ep.param_name = ${paramName} AND ep.param_value = ${paramCondition.eq.toString()})`
                    );
                    eqParamNames.push(paramName);
                  }

                  // Handle neq condition - needs separate NOT EXISTS
                  if (
                    paramCondition.neq !== undefined &&
                    paramCondition.neq !== null
                  ) {
                    neqConditions.push(
                      sql`NOT EXISTS (
                        SELECT 1 FROM events_params ep_neq
                        WHERE ep_neq.event_id = ${events.id}
                        AND ep_neq.param_name = ${paramName}
                        AND ep_neq.param_value = ${paramCondition.neq.toString()}
                      )`
                    );
                  }

                  // Handle gte condition
                  if (
                    "gte" in paramCondition &&
                    paramCondition.gte !== undefined &&
                    paramCondition.gte !== null
                  ) {
                    paramOrConditions.push(
                      sql`(ep.param_name = ${paramName} AND CAST(ep.param_value AS REAL) >= ${paramCondition.gte})`
                    );
                    eqParamNames.push(paramName);
                  }

                  // Handle lte condition
                  if (
                    "lte" in paramCondition &&
                    paramCondition.lte !== undefined &&
                    paramCondition.lte !== null
                  ) {
                    paramOrConditions.push(
                      sql`(ep.param_name = ${paramName} AND CAST(ep.param_value AS REAL) <= ${paramCondition.lte})`
                    );
                    eqParamNames.push(paramName);
                  }
                }
              });

              // Build optimized IN subquery with single JOIN
              if (paramOrConditions.length > 0) {
                const orClause = paramOrConditions.reduce(
                  (acc, condition, index) =>
                    index === 0 ? condition : sql`${acc} OR ${condition}`
                );

                conditions.push(sql`(
                  ${events.eventName} = ${eventType}
                  AND ${events.id} IN (
                    SELECT ep.event_id
                    FROM events_params ep
                    WHERE ${orClause}
                    GROUP BY ep.event_id
                    HAVING COUNT(DISTINCT ep.param_name) = ${eqParamNames.length}
                  )
                )`);
              }

              // Add neq conditions separately
              if (neqConditions.length > 0) {
                neqConditions.forEach((condition) =>
                  conditions.push(condition)
                );
              }
            }
          });
        }

        // Handle flattened parameter filtering (cross-event-type queries)
        // Optimized: Use JOIN with aggregation instead of correlated subqueries
        if (where?.paramsFlat) {
          const paramOrConditions: SQLCondition[] = [];
          const eqParamNames: string[] = [];
          const neqConditions: SQLCondition[] = [];

          Object.keys(where.paramsFlat).forEach((paramName) => {
            const paramCondition = where.paramsFlat![paramName];
            if (paramCondition && typeof paramCondition === "object") {
              // Handle eq condition - collect for GROUP BY/HAVING
              if (
                paramCondition.eq !== undefined &&
                paramCondition.eq !== null
              ) {
                paramOrConditions.push(
                  sql`(ep.param_name = ${paramName} AND ep.param_value = ${paramCondition.eq.toString()})`
                );
                eqParamNames.push(paramName);
              }

              // Handle neq condition - needs separate NOT EXISTS
              if (
                paramCondition.neq !== undefined &&
                paramCondition.neq !== null
              ) {
                neqConditions.push(
                  sql`NOT EXISTS (
                    SELECT 1 FROM events_params ep_neq
                    WHERE ep_neq.event_id = ${events.id}
                    AND ep_neq.param_name = ${paramName}
                    AND ep_neq.param_value = ${paramCondition.neq.toString()}
                  )`
                );
              }

              // Handle in condition - OR multiple values for same param
              if (
                "in" in paramCondition &&
                Array.isArray(paramCondition.in) &&
                paramCondition.in.length > 0
              ) {
                const valueConditions = paramCondition.in.map(
                  (val: any) => sql`ep.param_value = ${val.toString()}`
                );
                const valueOrClause = valueConditions.reduce(
                  (acc: SQLCondition, condition: SQLCondition, index: number) =>
                    index === 0 ? condition : sql`${acc} OR ${condition}`
                );
                paramOrConditions.push(
                  sql`(ep.param_name = ${paramName} AND (${valueOrClause}))`
                );
                eqParamNames.push(paramName);
              }

              // Handle gte condition
              if (
                "gte" in paramCondition &&
                paramCondition.gte !== undefined &&
                paramCondition.gte !== null
              ) {
                paramOrConditions.push(
                  sql`(ep.param_name = ${paramName} AND CAST(ep.param_value AS REAL) >= ${paramCondition.gte})`
                );
                eqParamNames.push(paramName);
              }

              // Handle lte condition
              if (
                "lte" in paramCondition &&
                paramCondition.lte !== undefined &&
                paramCondition.lte !== null
              ) {
                paramOrConditions.push(
                  sql`(ep.param_name = ${paramName} AND CAST(ep.param_value AS REAL) <= ${paramCondition.lte})`
                );
                eqParamNames.push(paramName);
              }
            }
          });

          // Build optimized IN subquery with single JOIN
          if (paramOrConditions.length > 0) {
            const orClause = paramOrConditions.reduce((acc, condition, index) =>
              index === 0 ? condition : sql`${acc} OR ${condition}`
            );

            conditions.push(sql`${events.id} IN (
              SELECT ep.event_id
              FROM events_params ep
              WHERE ${orClause}
              GROUP BY ep.event_id
              HAVING COUNT(DISTINCT ep.param_name) = ${eqParamNames.length}
            )`);
          }

          // Add neq conditions separately
          if (neqConditions.length > 0) {
            neqConditions.forEach((condition) => conditions.push(condition));
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
              claims: true,
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
  Subscription: {
    eventsStream: {
      subscribe: async function* (_: any, __: any, context: GraphQLContext) {
        let lastCheckedTimestamp = DateTime.now().toUnixInteger();
        while (true) {
          try {
            const newEvents =
              (await db?.query.events.findMany({
                limit: 20,
                with: {
                  params: true,
                  traces: true,
                  claims: true,
                },
                where: sql`${events.createdAt} > ${lastCheckedTimestamp}`,
                orderBy: () => [asc(events.createdAt)],
              })) || [];

            for (const event of newEvents) {
              if (event.createdAt) {
                lastCheckedTimestamp = DateTime.fromJSDate(
                  event.createdAt
                ).toUnixInteger();
              }
              yield { eventsStream: event };
            }
            await new Promise((resolve) => setTimeout(resolve, 2000));
          } catch (error) {
            context.logger?.error("Error in eventsStream subscription:", error);
          }
        }
      },
    },
  },
};
