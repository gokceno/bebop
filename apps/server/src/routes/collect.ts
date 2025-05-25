import { z } from "zod";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { CollectPayload } from "../types";
import { db, schema } from "../utils/db";

export default async function collectRoute(fastify: FastifyInstance) {
  // Hook-based authentication approach
  fastify.addHook(
    "preHandler",
    fastify.auth([fastify.verifyJWT, fastify.verifyBearer])
  );

  // GET /collect - Returns status information
  fastify.get("/collect", async (request: FastifyRequest) => {
    const tokenInfo = request.jwt?.user || {
      message: "Authenticated with bearer token",
    };

    return {
      message: "Collect endpoint is running",
      timestamp: new Date().toISOString(),
      auth: tokenInfo,
    };
  });

  // POST /collect - Processes and stores collected data
  fastify.post("/collect", async (request, reply) => {
    // Get authentication method from the flag set by auth functions
    const authMethod = (request as any).authMethod || "unknown";
    const jwtPayload = (request as any).jwtPayload;

    // Dynamically build the schema from config
    const eventTypes = fastify.config.eventTypes || [];

    // Create union of event type literals
    const eventLiterals = eventTypes.map((et: any) => z.literal(et.type));
    const eventUnion =
      eventLiterals.length > 0 ? z.union(eventLiterals as any) : z.string();

    // Create params schema based on config
    const paramsSchemas = eventTypes.reduce((acc: any, eventType: any) => {
      const paramsSchema: any = {};
      if (eventType.params) {
        eventType.params.forEach((param: any) => {
          Object.entries(param).forEach(([key, type]) => {
            if (type === "numeric") {
              paramsSchema[key] = z.number();
            } else if (type === "string") {
              paramsSchema[key] = z.string();
            } else {
              paramsSchema[key] = z.unknown();
            }
          });
        });
      }
      acc[eventType.type] = z.object(paramsSchema);
      return acc;
    }, {});

    // Create a union of all possible param schemas
    const paramsSchemaValues = Object.values(paramsSchemas);
    const paramsUnion =
      paramsSchemaValues.length > 0
        ? z.union(paramsSchemaValues as any)
        : z.object({});

    const payloadSchema = z.object({
      $event: eventUnion,
      $params: paramsUnion,
      $trace: z.array(z.unknown()),
    });

    try {
      const body: CollectPayload | object = request.body || {};

      const validatedPayload: any = payloadSchema.safeParse(body);
      if (!validatedPayload.success) {
        fastify.logger.error(validatedPayload.error);
        throw new Error(`Invalid payload.`);
      }

      fastify.logger.debug(`Event: ${validatedPayload.data.$event}`);
      fastify.logger.debug(
        `Validated params: ${JSON.stringify(validatedPayload.data.$params)}`
      );
      fastify.logger.debug(
        `Validated trace: ${JSON.stringify(validatedPayload.data.$trace)}`
      );
      if (jwtPayload)
        fastify.logger.debug(
          `JWT data to be inserted: ${JSON.stringify(jwtPayload)}`
        );

      // Insert event data into the database
      const eventData = await db.transaction(async (tx) => {
        // Create the event record
        const [newEvent] = await tx
          .insert(schema.events)
          .values({
            eventName: validatedPayload.data.$event,
            originator: jwtPayload || {},
          })
          .returning();

        // Insert all parameters
        if (validatedPayload.data.$params) {
          const paramsEntries = Object.entries(validatedPayload.data.$params);
          if (paramsEntries.length > 0) {
            await tx.insert(schema.eventsParams).values(
              paramsEntries.map(([paramName, paramValue]) => ({
                eventId: newEvent.id,
                paramName,
                paramValue: paramValue?.toString() || "",
              }))
            );
          }
        }

        // Insert trace data - each trace item as separate record
        if (
          validatedPayload.data.$trace &&
          Array.isArray(validatedPayload.data.$trace) &&
          validatedPayload.data.$trace.length > 0
        ) {
          await tx.insert(schema.eventsTraces).values(
            validatedPayload.data.$trace.map((traceData: object) => ({
              eventId: newEvent.id,
              traceData,
            }))
          );
        }

        return newEvent;
      });

      return reply.status(201).send({
        success: true,
        eventId: eventData.id,
        received: {
          $event: validatedPayload.data.$event,
          $params: validatedPayload.data.$params,
        },
        auth: {
          method: authMethod,
        },
      });
    } catch (error) {
      fastify.logger.error(`Error processing collect request: ${error}`);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
}
