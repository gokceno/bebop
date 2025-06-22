import type { SQL } from "drizzle-orm";

export type GraphQLEventQueryArgs = {
  limit?: number;
  offset?: number;
  order?: "asc" | "desc";
  where?: EventWhereInput;
};

export type EventWhereInput = {
  email?: string;
  eventName?: string;
  params?: EventParamsInput;
};

export type EventParamsInput = {
  [eventType: string]: {
    [paramName: string]: string | number;
  };
};

export type EventsResponse = {
  events: Event[];
  total: number;
};

export type Event = {
  id: string;
  eventName: string;
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

export type SQLCondition = SQL<unknown>;
