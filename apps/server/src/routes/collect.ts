import { z } from "zod";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { CollectPayload } from "../types";
import { db, schema } from "../utils/db";

export default async function collectRoute(fastify: FastifyInstance) {
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
            if (type === "number") {
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

    try {
      const body: CollectPayload | object = request.body || {};
      
      // First validate the basic structure and event type
      const basicPayloadSchema = z.object({
        $event: eventUnion,
        $params: z.object({}).passthrough(), // Allow any params for now
        $trace: z.array(z.unknown()),
      });
      
      const basicValidation = basicPayloadSchema.safeParse(body);
      if (!basicValidation.success) {
        fastify.logger.error(basicValidation.error);
        throw new Error(`Invalid payload structure.`);
      }
      
      // Now validate params against the specific event type schema
      const eventType = basicValidation.data.$event;
      const eventParamsSchema = paramsSchemas[eventType] || z.object({});
      
      const paramsValidation = eventParamsSchema.safeParse(basicValidation.data.$params);
      if (!paramsValidation.success) {
        fastify.logger.error(paramsValidation.error);
        throw new Error(`Invalid parameters for event type '${eventType}'.`);
      }
      
      // Create the final validated payload
      const validatedPayload = {
        success: true,
        data: {
          $event: basicValidation.data.$event,
          $params: paramsValidation.data,
          $trace: basicValidation.data.$trace,
        }
      };

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
            validatedPayload.data.$trace.map((traceData: unknown) => ({
              eventId: newEvent.id,
              traceData: traceData as object,
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
