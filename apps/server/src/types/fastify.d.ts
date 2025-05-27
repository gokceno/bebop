import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { Config, JWTPayload } from ".";
import type { Logger } from "winston";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type * as schema from "../schema";

declare module "fastify" {
  interface FastifyInstance {
    config: Config;
    logger: Logger;
    db: LibSQLDatabase<typeof schema>;
    verifyJWT: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    verifyBearer: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }

  interface FastifyRequest {
    jwt?: {
      user?: JWTPayload;
      [key: string]: unknown;
    };
    authMethod?: "jwt" | "bearer";
    jwtPayload?: JWTPayload;
    bearerToken?: string;
  }
}
