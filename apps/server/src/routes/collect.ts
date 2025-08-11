import { z } from "zod";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { CollectPayload, JWTPayload, ParamsInput } from "../types";
import { Default as DefaultCollectHandler } from "./handlers/default";

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
  fastify.post("/collect", async (request: FastifyRequest, reply) => {
    // Get authentication method from the flag set by auth functions
    const authMethod: string = request.authMethod || "unknown";
    const jwtPayload: JWTPayload | undefined = request.jwtPayload;

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
          Object.entries(param).forEach(([key, paramConfig]: [string, any]) => {
            if (paramConfig.type === "number") {
              paramsSchema[key] = z.number();
            } else if (paramConfig.type === "string") {
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

      const paramsValidation = eventParamsSchema.safeParse(
        basicValidation.data.$params
      );
      if (!paramsValidation.success) {
        fastify.logger.error(paramsValidation.error);
        throw new Error(`Invalid parameters for event type '${eventType}'.`);
      }

      const $event: string = basicValidation.data.$event;
      const $params: ParamsInput = paramsValidation.data;
      const $trace: object = basicValidation.data.$trace;

      fastify.logger.debug(`Event: ${$event}`);
      fastify.logger.debug(`Validated params: ${JSON.stringify($params)}`);
      fastify.logger.debug(`Validated trace: ${JSON.stringify($trace)}`);
      if (jwtPayload)
        fastify.logger.debug(
          `JWT data to be inserted: ${JSON.stringify(jwtPayload)}`
        );

      const handlers = [new DefaultCollectHandler()]
        .filter((h) => h.satisfies.includes(authMethod))
        .filter((h) => h.target.includes($event) || h.target.includes("*"));

      const eventIds: object[] = [];
      for (const handler of handlers) {
        const eventId = await handler.handle(
          $event,
          $params,
          $trace,
          jwtPayload,
          fastify.config
        );
        if (eventId !== null) eventIds.push(eventId);
      }

      return reply.status(201).send({
        eventIds,
        received: {
          $event,
          $params,
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
