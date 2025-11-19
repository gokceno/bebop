import fastifyJwt from "@fastify/jwt";
import fastifyAuth from "@fastify/auth";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { Config } from "../types";

export function setupAuth(fastify: FastifyInstance, config: Config): void {
  fastify.register(fastifyJwt, {
    secret: config.auth.jwt.secret,
    verify: {
      maxAge: config.auth.jwt.maxAge,
    },
  });
  fastify.register(fastifyAuth);
  fastify.decorate(
    "verifyJWT",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const jwtPayload = await request.jwtVerify();
        (request as any).authMethod = "jwt";
        (request as any).jwtPayload = jwtPayload;
      } catch (err) {
        throw new Error("JWT authentication failed");
      }
    }
  );

  fastify.decorate(
    "verifyBearer",
    async (request: FastifyRequest, reply: FastifyReply) => {
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
    }
  );
}
