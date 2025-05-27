import type { Logger } from "winston";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { schema } from "../utils/db";

export type Config = {
  auth: {
    bearerTokens: string[];
    jwt: {
      secret: string;
      maxAge: string;
    };
  };
  eventTypes: {
    type: string;
    trace: boolean;
    params: { [key: string]: "numeric" | "string" }[];
  }[];
};

export type CollectPayload = {
  $event: string;
  $params: object;
  $trace: object[];
};

export type GraphQLEventQueryArgs = {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
};

export type GraphQLContext = {
  jwtPayload?: JWTPayload;
  authMethod?: string;
  logger?: Logger;
  db?: LibSQLDatabase<typeof schema>;
};

export type JWTPayload = {
  [key: string]: string;
};
