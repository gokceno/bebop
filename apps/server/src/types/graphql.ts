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
  eventName?: StringCondition;
  eventType?: string;
  createdAt?: NumberCondition;
  params?: EventParamsInput;
  claims?: EventClaimsInput;
};

export type EventParamsInput = {
  [eventType: string]: {
    [paramName: string]: StringCondition | NumberCondition;
  };
};

export type EventClaimsInput = {
  [claimName: string]: StringCondition;
};

export type EventsResponse = {
  events: Event[];
  total: number;
};

export type Event = {
  id: string;
  eventName: string;
  eventType: string;
  createdAt: Date;
  params: EventParam[];
  traces: EventTrace[];
  claims: EventClaim[];
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

export type EventClaim = {
  id: string;
  eventId: string;
  claimName: string;
  claimValue: string;
  createdAt: Date;
};

export type EventType = {
  type: string;
  label: string;
  params: EventTypeParam[];
};

export type EventTypeParam = {
  name: string;
  type: string;
  label: string;
};

export type Parameter = {
  name: string;
  label: string;
  type: string;
  eventTypes: string[];
};

export type ClaimType = {
  name: string;
};

export type SQLCondition = SQL<unknown>;
