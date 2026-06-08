import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 uses the Rust-free "client" engine, which REQUIRES a driver adapter
// (or accelerateUrl). For PostgreSQL we use @prisma/adapter-pg.
// NOTE: do not throw at module load — many routes import this defensively and
// the app should still render (with degraded data) when the DB is unreachable.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString =
  process.env.DATABASE_URL ??
  (() => {
    console.warn(
      "[prisma] DATABASE_URL is not set — using a placeholder. DB queries will fail until you configure .env.local",
    );
    return "postgresql://placeholder:placeholder@localhost:5432/placeholder";
  })();

const adapter = new PrismaPg({ connectionString });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
