import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import schema from "./schema";

type Schema = typeof schema;
type Db = LibSQLDatabase<Schema>;

let _db: Db | undefined;

function getDb(): Db {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Copy .env.local.example to .env.local and fill in values.",
      );
    }
    _db = drizzle(
      createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN }),
      { schema },
    );
  }
  return _db;
}

export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
}) as Db;
