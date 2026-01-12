import { create as createConfig } from "@gokceno/konfeti";
import type { CamelCaseConfig } from "@gokceno/konfeti/types";
import * as z from "zod";

const configSchema = z.object({
  auth: z.object({
    bearer_tokens: z.array(z.string()),
    jwt: z.object({
      secret: z.string(),
      opts: z.object({
        max_age: z.string(),
      }),
      claims: z.array(z.string()),
    }),
    cors: z.object({
      allowed_origins: z.array(z.string().url()),
    }),
  }),
  event_types: z.array(
    z.object({
      type: z.string(),
      label: z.string().optional(),
      trace: z.boolean(),
      params: z.array(
        z.record(
          z.string(),
          z.object({
            type: z.union([z.literal("number"), z.literal("string")]),
            label: z.string(),
          })
        )
      ),
    })
  ),
});

export type RawConfig = z.infer<typeof configSchema>;
export type Config = CamelCaseConfig<RawConfig>;

export const { parse } = createConfig(configSchema);
