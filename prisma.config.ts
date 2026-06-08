import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load local env first (.env.local), then fall back to .env, so prisma CLI
// commands (generate / db push / migrate) and `npm run seed` pick up DATABASE_URL.
config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
    shadowDatabaseUrl: env("DIRECT_URL"),
  },
});
