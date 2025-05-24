export type Config = {
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
