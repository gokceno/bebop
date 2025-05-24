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
