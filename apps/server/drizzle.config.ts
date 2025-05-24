import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dbCredentials: {
    url: `./db/bebop.sqlite`,
  },
  schema: `./src/schema.ts`,
  out: `./db/migrations/`,
  dialect: "sqlite",
});
