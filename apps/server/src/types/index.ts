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
  order?: "asc" | "desc";
  where?: {
    email?: string;
    eventName?: string;
    params?: {
      [key: string]: string;
    };
  };
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
  handle: (
    $event: string,
    $params: ParamsInput,
    $trace: object,
    jwtPayload: JWTPayload
  ) => Promise<object>;
}

export type ParamsInput = {
  [key: string]: string | number;
};
