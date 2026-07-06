import { z } from "zod";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { CollectPayload, JWTPayload, ParamsInput } from "../types";
import { createCollectQueue } from "../utils/queue";

export default async function collectRoute(fastify: FastifyInstance) {
  const collectQueue = createCollectQueue(fastify.config.database.redis.url);

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

  // POST /collect - Accepts and queues collected data
  fastify.post("/collect", async (request: FastifyRequest, reply) => {
    const authMethod = request.authMethod as "jwt" | "bearer";
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

    const body: CollectPayload | object = request.body || {};

    // Validate the basic structure and event type
    const basicPayloadSchema = z.object({
      $event: eventUnion,
      $params: z.object({}).passthrough(), // Allow any params for now
      $trace: z.array(z.unknown()),
    });

    const basicValidation = basicPayloadSchema.parse(body);

    // Now validate params against the specific event type schema
    const eventType = basicValidation.$event;
    const eventParamsSchema = paramsSchemas[eventType] || z.object({});
    const paramsValidation = eventParamsSchema.parse(basicValidation.$params);

    const $event: string = basicValidation.$event;
    const $params: ParamsInput = paramsValidation;
    const $trace: object = basicValidation.$trace;

    fastify.logger.debug(`Event: ${$event}`);
    fastify.logger.debug(`Validated params: ${JSON.stringify($params)}`);
    fastify.logger.debug(`Validated trace: ${JSON.stringify($trace)}`);
    if (jwtPayload)
      fastify.logger.debug(
        `JWT data to be inserted: ${JSON.stringify(jwtPayload)}`
      );

    const job = await collectQueue.add(
      "process-collect",
      {
        $event,
        $params,
        $trace,
        authMethod,
        jwtPayload,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      }
    );

    return reply.status(202).send({
      queued: true,
      jobId: job.id,
      received: {
        $event,
        $params,
      },
      auth: {
        method: authMethod,
      },
    });
  });
}
