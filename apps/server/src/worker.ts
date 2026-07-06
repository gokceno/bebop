import { Worker } from "bullmq";
import { parse, type Config } from "./utils/config";
import { logger } from "./utils/logger";
import { COLLECT_QUEUE_NAME, createRedisConnection } from "./utils/queue";
import { Default as DefaultCollectHandler } from "./handlers/default";
import type { CollectJobData, ICollectHandler } from "./types";

const config: Config = parse("bebop.yml");

const worker = new Worker<CollectJobData, { eventIds: object[] }>(
  COLLECT_QUEUE_NAME,
  async (job) => {
    logger.info(`Processing collect job ${job.id}`, {
      event: job.data.$event,
    });

    const handlers = [new DefaultCollectHandler()]
      .filter((h: ICollectHandler) => h.satisfies.includes(job.data.authMethod))
      .filter(
        (h: ICollectHandler) =>
          h.target.includes(job.data.$event) || h.target.includes("*")
      );

    const eventIds: object[] = [];
    for (const handler of handlers) {
      const eventId = await handler.handle(
        job.data.$event,
        job.data.$params,
        job.data.$trace,
        job.data.jwtPayload,
        config
      );
      if (eventId !== null) eventIds.push(eventId);
    }

    logger.info(`Completed collect job ${job.id}`, { eventIds });

    return { eventIds };
  },
  {
    connection: createRedisConnection(config.database.redis.url),
  }
);

worker.on("error", (err) => {
  logger.error("Worker error", err);
});

const shutdown = async (signal: string) => {
  logger.info(`Worker received ${signal}, shutting down...`);
  await worker.close();
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
