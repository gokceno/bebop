import { command, string } from "@drizzle-team/brocli";
import { createClient } from "graphql-sse";
import chalk from "chalk";
import * as emoji from "node-emoji";
import { DateTime } from "luxon";

const tail = command({
  name: "tail",
  options: {
    // "config-file": string()
    //   .desc("Path to config file")
    //   .default("../../freelea.yml")
    //   .required(),
  },
  handler: async (opts) => {
    const client = createClient({
      url: "http://localhost:3000/graphql",
      headers: {
        Authorization: "Bearer bebop-api-key-1",
        Accept: "text/event-stream",
      },
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
          console.log(lineMapper(result.data?.eventsStream as LogEntry));
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

const formatTimestamp = (createdAt: Date | string) => {
  let dateTime: DateTime;

  if (typeof createdAt === "string") {
    dateTime = DateTime.fromISO(createdAt);
  } else {
    dateTime = DateTime.fromJSDate(createdAt);
  }

  if (!dateTime.isValid) {
    console.warn("Invalid DateTime:", createdAt, dateTime.invalidReason);
    return String(createdAt);
  }

  const today = DateTime.now().startOf("day");
  const entryDate = dateTime.startOf("day");

  if (entryDate.equals(today)) {
    return dateTime.toFormat("HH:mm:ss");
  } else {
    return dateTime.toFormat("yyyy-MM-dd HH:mm:ss");
  }
};

const lineMapper = (entry: LogEntry) => {
  const mappers = [
    {
      forEvents: ["error", "critical", "crit"],
      translate: (entry: LogEntry) => {
        const params = entry.params as Array<LogEntryParameter>;
        const paramLines = params.map(
          (param: LogEntryParameter) =>
            `${chalk.yellow(param.paramName)}: ${param.paramValue}`
        );
        return [
          chalk.blue(formatTimestamp(entry.createdAt)),
          emoji.get(":bell:"),
          chalk.red(entry.eventName),
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
            `${chalk.yellow(param.paramName)}: ${param.paramValue}`
        );
        return [
          chalk.blue(formatTimestamp(entry.createdAt)),
          emoji.get(":bell:"),
          chalk.green(entry.eventName),
          emoji.get(":bulb:"),
          paramLines.join(", "),
        ].join(" ");
      },
    },
    {
      forEvents: ["warn", "notice"],
      translate: (entry: LogEntry) => {
        const params = entry.params as Array<LogEntryParameter>;
        const paramLines = params.map(
          (param: LogEntryParameter) =>
            `${chalk.yellow(param.paramName)}: ${param.paramValue}`
        );
        return [
          chalk.blue(formatTimestamp(entry.createdAt)),
          emoji.get(":bell:"),
          chalk.yellow(entry.eventName),
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
            `${chalk.yellow(param.paramName)}: ${param.paramValue}`
        );
        return [
          chalk.blue(formatTimestamp(entry.createdAt)),
          emoji.get(":bell:"),
          chalk.magenta(entry.eventName),
          emoji.get(":bulb:"),
          paramLines.join(", "),
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
            `${chalk.yellow(param.paramName)}: ${param.paramValue}`
        );
        return [
          chalk.blue(formatTimestamp(entry.createdAt)),
          emoji.get(":bell:"),
          chalk.gray(entry.eventName),
          emoji.get(":bulb:"),
          paramLines.join(", "),
        ].join(" ");
      },
    },
  ];
  // TODO: Error handling
  return mappers
    .filter(
      (m) => m.forEvents.includes(entry.eventName) || m.forEvents.includes("*")
    )[0]
    .translate(entry);
};

type LogEntry = {
  eventName: string;
  createdAt: Date | string;
  params: Array<LogEntryParameter>;
  traces: Array<LogEntryTrace>;
};

type LogEntryParameter = {
  paramName: string;
  paramValue: string;
};

type LogEntryTrace = {
  traceData: any;
};

export default tail;
