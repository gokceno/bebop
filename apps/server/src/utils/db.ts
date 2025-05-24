import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "../schema";

const db = drizzle(`file:./db/bebop.sqlite`);

await migrate(db, { migrationsFolder: "./db/migrations" });

export { db, schema };
