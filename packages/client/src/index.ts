import PQueue from "p-queue";
import got from "got";
import type {
  BebopConfig,
  BebopClient,
  BebopFactory,
  BebopSendArgs,
} from "./types";

export const Bebop: BebopFactory = ({
  concurrency = 1,
  baseUrl,
  bearerToken,
  jwt,
  output,
}: BebopConfig = {}): BebopClient => {
  if (!baseUrl || baseUrl.indexOf("https://"))
    throw new Error("Missing https URL.");
  if (!bearerToken && !jwt)
    throw new Error(
      "Missing authentication header; either JWT or bearer token should be present."
    );
  const queue = new PQueue({ concurrency });
  return {
    send: async (...args: BebopSendArgs): Promise<void> => {
      const [eventName, eventParams, eventTrace] = args;
      if (eventTrace && !Array.isArray(eventTrace))
        if (output) console.error("Event trace must be an object array.");
      await queue.add(async () => {
        try {
          const response = await got
            .post(`${baseUrl}/collect`, {
              headers: {
                Authorization: `Bearer ${bearerToken || jwt}`,
              },
              json: {
                $event: eventName,
                $params: eventParams || {},
                $trace: eventTrace || [],
              },
            })
            .json();
          if (output) console.log(response);
        } catch (e: any) {
          if (output) console.error(e.message);
        }
      });
    },
  };
};
