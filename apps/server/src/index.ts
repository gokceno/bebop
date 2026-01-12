import Fastify from "fastify";
import { parse, type Config } from "./utils/config";
import { logger } from "./utils/logger";
import { setupAuth } from "./utils/auth";
import collectRoute from "./routes/collect";
import graphqlRoute from "./routes/graphql";
import type { FastifyInstance } from "fastify";

const config: Config = parse(process.env.CONFIG_PATH || "bebop.yml");

const fastify: FastifyInstance = Fastify();

fastify.decorate("logger", logger);
fastify.decorate("config", config);

fastify.register(import("@fastify/cors"), {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV === "development") {
      return callback(null, true);
    }
    const allowedOrigins = config.auth.cors?.allowedOrigins || [
      "http://localhost",
      "http://localhost:3000",
      "http://localhost:8000",
      "http://localhost:8080",
      "http://localhost:5173",
      "http://localhost:4173",
    ];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
});

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
