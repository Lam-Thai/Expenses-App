// server/db/client.ts
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (process.env.DATABASE_URL) {
  ("Database not founded! Please set DATABASE_URL in your environment variables.");
}
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
export { schema };
