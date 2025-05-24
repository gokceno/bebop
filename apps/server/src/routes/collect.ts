import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { CollectPayload } from "../types";

export default async function collectRoute(fastify: FastifyInstance) {
  // GET /collect - Returns status information
  fastify.get("/collect", async () => {
    return {
      message: "Collect endpoint is running",
      timestamp: new Date().toISOString(),
    };
  });

  // POST /collect - Processes and stores collected data
  fastify.post("/collect", async (request, reply) => {
    // Dynamically build the schema from config
    const eventTypes = fastify["config"].eventTypes || [];

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
        fastify["logger"].debug(validatedPayload.error);
        throw new Error(`Invalid payload.`);
      }

      fastify["logger"].debug(validatedPayload.data.$event);
      fastify["logger"].debug(JSON.stringify(validatedPayload.data.$params));
      fastify["logger"].debug(JSON.stringify(validatedPayload.data.$trace));

      return {
        success: true,
        received: {
          event: validatedPayload.data.$event,
          params: validatedPayload.data.$params,
        },
      };
    } catch (error) {
      reply.status(500);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
}
