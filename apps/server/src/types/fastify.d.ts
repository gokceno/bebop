import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { Config } from ".";
import type { Logger } from "winston";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type * as schema from "../schema";

interface JwtPayload {
  userId?: string;
  email?: string;
  roles?: string[];
  level?: number;
  [key: string]: unknown;
}

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
      user?: JwtPayload;
      [key: string]: unknown;
    };
    authMethod?: "jwt" | "bearer";
    jwtPayload?: JwtPayload;
    bearerToken?: string;
  }
}