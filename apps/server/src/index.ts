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

// Register CORS plugin with environment-based configuration
fastify.register(import("@fastify/cors"), {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // In development, allow all origins
    if (process.env.NODE_ENV === "development") {
      return callback(null, true);
    }

    // In production, check against allowed origins from config
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
