import { Bebop } from "@gokceno/bebop-client";
import type { BebopClient, BebopConfig } from "@gokceno/bebop-client/src/types";

// Example usage
const b: BebopClient = Bebop({
  baseUrl: "https://bebop.staging.brewww.net",
  bearerToken: "bebop-api-key-2",
} as BebopConfig);

b.send("postContent", { creatorId: "abc123" });
