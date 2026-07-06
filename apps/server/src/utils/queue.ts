import { Queue } from "bullmq";

export const COLLECT_QUEUE_NAME = "collect";

export const createRedisConnection = (redisUrl: string) => {
  const url = new URL(redisUrl);

  return {
    host: url.hostname || "localhost",
    port: Number(url.port || "6379"),
    username: url.username || undefined,
    password: url.password || undefined,
    maxRetriesPerRequest: null,
  } as any;
};

export const createCollectQueue = (redisUrl: string) =>
  new Queue(COLLECT_QUEUE_NAME, {
    connection: createRedisConnection(redisUrl),
  });
