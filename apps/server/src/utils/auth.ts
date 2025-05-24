import fastifyJwt from "@fastify/jwt";
import fastifyAuth from "@fastify/auth";
import { FastifyInstance, FastifyRequest } from "fastify";
import { Config } from "../types";

interface JwtPayload {
  userId?: string;
  roles?: string[];
  level?: number;
  [key: string]: unknown;
}

export function setupAuth(fastify: FastifyInstance, config: Config): void {
  fastify.register(fastifyJwt, {
    secret: config.auth.jwt.secret,
    verify: {
      maxAge: config.auth.jwt.maxAge,
    },
  });
  fastify.register(fastifyAuth);
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
      if (!config.auth.bearerTokens.includes(token)) {
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
