import type { SQL } from "drizzle-orm";

export type GraphQLEventQueryArgs = {
  limit?: number;
  offset?: number;
  order?: "asc" | "desc";
  where?: EventWhereInput;
};

export type StringCondition = {
  eq?: string;
  neq?: string;
};

export type NumberCondition = {
  eq?: number;
  neq?: number;
  gte?: number;
  lte?: number;
};

export type EventWhereInput = {
  email?: StringCondition;
  eventName?: StringCondition;
  eventType?: string;
  createdAt?: NumberCondition;
  params?: EventParamsInput;
};

export type EventParamsInput = {
  [eventType: string]: {
    [paramName: string]: StringCondition | NumberCondition;
  };
};

export type EventsResponse = {
  events: Event[];
  total: number;
};

export type Event = {
  id: string;
  eventName: string;
  eventType: string;
  originator: any;
  createdAt: Date;
  params: EventParam[];
  traces: EventTrace[];
};

export type EventParam = {
  id: string;
  eventId: string;
  paramName: string;
  paramValue: string;
  createdAt: Date;
};

export type EventTrace = {
  id: string;
  eventId: string;
  traceData: any;
  createdAt: Date;
};

export type EventType = {
  type: string;
  label: string;
};

export type SQLCondition = SQL<unknown>;
