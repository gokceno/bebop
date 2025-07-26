import type { Logger } from "winston";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { schema } from "../utils/db";

export type Config = {
  auth: {
    bearerTokens: string[];
    jwt: {
      secret: string;
      maxAge: string;
      mode: "decode" | "verify";
    };
    cors?: {
      allowedOrigins: string[];
    };
  };
  eventTypes: {
    type: string;
    label: string;
    trace: boolean;
    params: { [key: string]: { type: "numeric" | "string"; label: string } }[];
  }[];
};

export type CollectPayload = {
  $event: string;
  $params: object;
  $trace: object[];
};

export type GraphQLContext = {
  jwtPayload?: JWTPayload;
  authMethod?: string;
  logger?: Logger;
  db?: LibSQLDatabase<typeof schema>;
  config?: Config;
};

export type JWTPayload = {
  [key: string]: string;
};

export interface ICollectHandler {
  handlerName: string;
  target: string[];
  satisfies: string[];
  handle: (
    $event: string,
    $params: ParamsInput,
    $trace: object,
    jwtPayload: JWTPayload | undefined
  ) => Promise<object>;
}

export type ParamsInput = {
  [key: string]: string | number;
};

// Re-export GraphQL types
export * from "./graphql";
