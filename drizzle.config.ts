import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./database/migrations",
  schema: "./db/schema.ts",
  dialect: "sqlite",
});
