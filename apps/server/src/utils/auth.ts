import fastifyJwt from "@fastify/jwt";
import fastifyAuth from "@fastify/auth";
import { FastifyInstance, FastifyRequest } from "fastify";

interface JwtPayload {
  userId?: string;
  roles?: string[];
  level?: number;
  [key: string]: unknown;
}

// JWT secret should come from environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || "bebop-analytics-super-secret-key";

// Bearer tokens would be stored in a database in a real application
const BEARER_TOKENS = new Set([
  "bebop-api-key-1",
  "bebop-api-key-2",
  "test-token",
]);

export function setupAuth(fastify: FastifyInstance): void {
  // Register JWT plugin
  fastify.register(fastifyJwt, {
    secret: JWT_SECRET,
    sign: {
      expiresIn: "1d", // Token expires in 1 day
    },
    verify: {
      maxAge: "1d", // Maximum age of token
    },
  });

  // Register auth plugin (required for combining auth strategies)
  fastify.register(fastifyAuth);

  // We'll implement our own bearer auth instead of using the plugin
  // to avoid type conflicts

  // Decorators for authentication - these must match FastifyAuthFunction signature
  fastify.decorate("verifyJWT", async (request: FastifyRequest) => {
    try {
      const jwtPayload = await request.jwtDecode();

      // Set auth method flag on request
      (request as any).authMethod = "jwt";
      (request as any).jwtPayload = jwtPayload;
    } catch (err) {
      throw new Error("JWT authentication failed");
    }
  });

  fastify.decorate("verifyBearer", async (request: FastifyRequest) => {
    try {
      const authorization = request.headers.authorization;
      if (!authorization || !authorization.startsWith("Bearer ")) {
        throw new Error("Missing or invalid bearer token");
      }

      const token = authorization.slice(7); // Remove 'Bearer ' prefix
      if (!BEARER_TOKENS.has(token)) {
        throw new Error("Invalid bearer token");
      }
      // Set auth method flag on request
      (request as any).authMethod = "bearer";
      (request as any).bearerToken = token;
    } catch (err) {
      throw new Error("Bearer token authentication failed");
    }
  });
}

// Type augmentation for Fastify
declare module "fastify" {
  interface FastifyInstance {
    verifyJWT: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    verifyBearer: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }

  interface FastifyRequest {
    jwt?: {
      user?: JwtPayload;
      [key: string]: unknown;
    };
    authMethod?: "jwt" | "bearer";
    jwtPayload?: any;
    bearerToken?: string;
  }
}
