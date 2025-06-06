import Fastify from "fastify";
import { yaml } from "./utils/config";
import { logger } from "./utils/logger";
import { setupAuth } from "./utils/auth";
import collectRoute from "./routes/collect";
import graphqlRoute from "./routes/graphql";
import type { Config } from "./types";
import type { FastifyInstance } from "fastify";

const config: Config = yaml("bebop.yml");

const fastify: FastifyInstance = Fastify();

// Decorate fastify instance with logger and config
fastify.decorate("logger", logger);
fastify.decorate("config", config);

// Setup JWT and bearer authentication
setupAuth(fastify, config);

// Declare a root route
fastify.get("/", async () => {
  return { server: "running" };
});

// Register routes
fastify.register(collectRoute);
fastify.register(graphqlRoute);

// Run the server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    logger.info("Server listening on http://0.0.0.0:3000");
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

start();
