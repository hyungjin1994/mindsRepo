import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load local env first (.env.local), then fall back to .env, so prisma CLI
// commands (generate / db push / migrate) and `npm run seed` pick up the env.
config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "./prisma/schema.prisma",
  // 마이그레이션/db push 전용 연결. 런타임 연결은 lib/prisma.ts 의 어댑터(DATABASE_URL).
  // Supabase: DIRECT_URL 을 세션 풀러(5432)로 두면 풀러 advisory-lock 문제 없이 push 가능.
  datasource: {
    url: env("DIRECT_URL"),
  },
});
