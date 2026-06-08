// Standalone seed script (run with: npm run seed).
// Loads env from .env.local then .env, and uses the Prisma 7 pg driver adapter.
require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Configure it in .env.local or .env before seeding.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding sample data...");

  const user = await prisma.user.upsert({
    where: { email: "mother@example.com" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      email: "mother@example.com",
      name: "어머니",
      points: 200,
    },
  });

  await prisma.familyMember.upsert({
    where: { accessToken: "seed-child-token" },
    update: {},
    create: {
      userId: user.id,
      name: "큰아들",
      accessToken: "seed-child-token",
    },
  });

  await prisma.magicLink.upsert({
    where: { token: "seed-family-token" },
    update: {},
    create: {
      token: "seed-family-token",
      email: "family@example.com",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });

  await prisma.reminder.createMany({
    data: [
      { userId: user.id, kind: "MEDICATION", title: "아침 약", scheduledAt: new Date() },
      { userId: user.id, kind: "WORKOUT", title: "산책", scheduledAt: new Date() },
    ],
  });

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
