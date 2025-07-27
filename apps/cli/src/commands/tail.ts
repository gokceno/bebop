import { command, string } from "@drizzle-team/brocli";
import { createClient } from "graphql-sse";
import chalk from "chalk";
import * as emoji from "node-emoji";
import type {
  EventType,
  Parameter,
  LogEntry,
  LogEntryParameter,
} from "../types";
import { fetchDependents } from "../utils/fetchers";
import { timestamp as formatTimestamp } from "../utils/formatters";

const tail = command({
  name: "tail",
  options: {
    url: string().desc("URL to the Bebop GraphQL endpoint.").required(),
    "api-key": string().desc("API key").required(),
  },
  handler: async (opts) => {
    const client = createClient({
      url: opts.url,
      headers: {
        Authorization: `Bearer ${opts["api-key"]}`,
        Accept: "text/event-stream",
      },
    });
    const { eventTypes, parameters } = await fetchDependents({
      url: opts.url,
      apiKey: opts["api-key"],
    });
    try {
      const query = client.iterate({
        query: `
          subscription {
            eventsStream {
              eventName
              createdAt
              params {
                paramName
                paramValue
              }
              traces {
                traceData
              }
            }
          }
        `,
      });
      console.log("Starting to tail events...");
      for await (const result of query) {
        if (result.data) {
          console.log(
            lineMapper(
              result.data?.eventsStream as LogEntry,
              eventTypes,
              parameters
            )
          );
        }
        if (result.errors) {
          console.error(emoji.get(":stop:"), "GraphQL errors:", result.errors);
        }
      }
    } catch (error) {
      console.error(emoji.get(":stop:"), "Connection error:", error);
    }
  },
});

const lineMapper = (
  entry: LogEntry,
  eventTypes: EventType[],
  parameters: Parameter[]
) => {
  const displayEventName =
    eventTypes.find((et) => et.type === entry.eventName)?.label ||
    entry.eventName;

  const getParameterLabel = (paramName: string) => {
    return parameters.find((p) => p.name === paramName)?.label || paramName;
  };
  const mappers = [
    {
      forEvents: ["error", "critical", "crit"],
      translate: (entry: LogEntry) => {
        const params = entry.params as Array<LogEntryParameter>;
        const paramLines = params.map(
          (param: LogEntryParameter) =>
            `${chalk.yellow(getParameterLabel(param.paramName))}: ${
              param.paramValue
            }`
        );
        return [
          chalk.blue(formatTimestamp(entry.createdAt)),
          emoji.get(":bell:"),
          chalk.red(displayEventName),
          emoji.get(":bulb:"),
          paramLines.join(", "),
          JSON.stringify(entry.traces.map((t) => t.traceData)),
        ].join(" ");
      },
    },
    {
      forEvents: ["info"],
      translate: (entry: LogEntry) => {
        const params = entry.params as Array<LogEntryParameter>;
        const paramLines = params.map(
          (param: LogEntryParameter) =>
            `${chalk.yellow(getParameterLabel(param.paramName))}: ${
              param.paramValue
            }`
        );
        return [
          chalk.blue(formatTimestamp(entry.createdAt)),
          emoji.get(":bell:"),
          chalk.green(displayEventName),
          emoji.get(":bulb:"),
          paramLines.join(", "),
        ].join(" ");
      },
    },
    {
      forEvents: ["warn", "notice", "warning"],
      translate: (entry: LogEntry) => {
        const params = entry.params as Array<LogEntryParameter>;
        const paramLines = params.map(
          (param: LogEntryParameter) =>
            `${chalk.yellow(getParameterLabel(param.paramName))}: ${
              param.paramValue
            }`
        );
        return [
          chalk.blue(formatTimestamp(entry.createdAt)),
          emoji.get(":bell:"),
          chalk.yellow(displayEventName),
          emoji.get(":bulb:"),
          paramLines.join(", "),
        ].join(" ");
      },
    },
    {
      forEvents: ["debug"],
      translate: (entry: LogEntry) => {
        const params = entry.params as Array<LogEntryParameter>;
        const paramLines = params.map(
          (param: LogEntryParameter) =>
            `${chalk.yellow(getParameterLabel(param.paramName))}: ${
              param.paramValue
            }`
        );
        return [
          chalk.blue(formatTimestamp(entry.createdAt)),
          emoji.get(":bell:"),
          chalk.magenta(displayEventName),
          emoji.get(":bulb:"),
          paramLines.join(", "),
          chalk.yellow("Trace:"),
          JSON.stringify(entry.traces.map((t) => t.traceData)),
        ].join(" ");
      },
    },
    {
      forEvents: ["*"],
      translate: (entry: LogEntry) => {
        const params = entry.params || [];
        const paramLines = params.map(
          (param: any) =>
            `${chalk.yellow(getParameterLabel(param.paramName))}: ${
              param.paramValue
            }`
        );
        return [
          chalk.blue(formatTimestamp(entry.createdAt)),
          emoji.get(":bell:"),
          chalk.gray(displayEventName),
          emoji.get(":bulb:"),
          paramLines.join(", "),
        ].join(" ");
      },
    },
  ];

  const mapper = mappers.find(
    (m) => m.forEvents.includes(entry.eventName) || m.forEvents.includes("*")
  );
  return mapper
    ? mapper.translate(entry)
    : `${chalk.blue(formatTimestamp(entry.createdAt))} ${entry.eventName}`;
};

export default tail;
