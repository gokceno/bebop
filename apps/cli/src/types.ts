export type EventType = {
  label: string;
  type: string;
};

export type Parameter = {
  name: string;
  label: string;
  type: string;
  eventTypes: string[];
};

export type LogEntry = {
  eventName: string;
  createdAt: Date | string;
  params: Array<LogEntryParameter>;
  traces: Array<LogEntryTrace>;
};

export type LogEntryParameter = {
  paramName: string;
  paramValue: string;
};

export type LogEntryTrace = {
  traceData: any;
};
