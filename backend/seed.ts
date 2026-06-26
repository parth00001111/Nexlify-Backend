import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("200,000 products are seeding...");

  const categories = ["electronics", "fashion", "books", "home", "sports", "beauty", "toys"];

  const BATCH_SIZE = 10000;
  const total = 200000;

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = Array.from({ length: Math.min(BATCH_SIZE, total - i) }, (_, idx) => {
      const num = i + idx;
      return {
        name: `Product ${num + 1} - ${categories[num % categories.length]}`,
        category: categories[num % categories.length]!,
        price: Math.floor(Math.random() * 9900) + 100,
      };
    });

    await prisma.product.createMany({
      data: batch,
      skipDuplicates: true,
    });

    console.log(`${i + batch.length} products done...`);
  }

  console.log("200,000 products created successfully!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());