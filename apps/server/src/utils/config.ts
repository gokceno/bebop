import fs from "fs";
import YAML from "yaml";
import { z } from "zod";
import { type Config } from "../types";

const yaml = (configFileName: string): Config => {
  if (!fs.existsSync(configFileName)) {
    throw new Error("Config file not found");
  }
  const file = fs.readFileSync(configFileName, "utf8");
  const snakeToCamelCase = (str: string): string =>
    str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

  const convertKeysToCamelCase = (obj: object): object => {
    if (Array.isArray(obj)) {
      return obj.map((item) => convertKeysToCamelCase(item));
    }
    if (obj && typeof obj === "object") {
      return Object.fromEntries(
        Object.entries(obj as object).map(([key, value]) => [
          snakeToCamelCase(key),
          convertKeysToCamelCase(value),
        ])
      );
    }
    return obj;
  };

  const config: object = YAML.parse(file);
  const validatedConfig: any = configSchema.safeParse(config);
  if (!validatedConfig.success) {
    throw new Error(`Invalid config: ${validatedConfig.error}`);
  }

  return convertKeysToCamelCase(config) as Config;
};

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

export { yaml };
