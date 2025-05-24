import Fastify, { FastifyInstance } from "fastify";
import { yaml } from "./utils/config";
import { logger } from "./utils/logger";
import { db } from "./utils/db";
import collectRoute from "./routes/collect";
import { Config } from "./types";

const config: Config = yaml("bebop.yml");

const fastify: FastifyInstance = Fastify({ logger: true });

// Decorate fastify instance with logger and config
fastify.decorate("logger", logger);
fastify.decorate("config", config);
fastify.decorate("db", db);

// Declare a root route
fastify.get("/", async () => {
  return { server: "running" };
});

// Register the collect route manually
fastify.register(collectRoute);

// Run the server
const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    logger.info("Server listening on http://0.0.0.0:3000");
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

start();
