import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "../schema";

const db = drizzle(`file:${process.env.DB_PATH || "./db/bebop.sqlite"}`, {
  schema,
});

await migrate(db, { migrationsFolder: "./db/migrations" });

export { db, schema };
