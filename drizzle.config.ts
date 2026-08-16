import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema",
  out: "./drizzle",
  // "turso" rather than "sqlite": it is what makes `authToken` a legal
  // dbCredentials key, and what makes drizzle-kit talk to the remote over HTTP.
  dialect: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
});
