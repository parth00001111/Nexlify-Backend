import "dotenv/config";
import express, { type RequestHandler } from "express";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";
import  cors from "cors";


const app = express();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

app.use(express.json());
app.use(cors())
const healthHandler: RequestHandler = (_, res) => {
  res.json({
    status: "Nexlify Backend is running",
  });
};

const productsHandler: RequestHandler = async (req, res) => {
  try {
    const cursor = req.query.cursor as string | undefined;
    const category = req.query.category as string | undefined;
    const take = Number(req.query.limit ?? 20);

    const products = await prisma.product.findMany({
      where: category
        ? {
            category,
          }
        : undefined,

      take,

      ...(cursor
        ? {
            cursor: {
              id: cursor,
            },
            skip: 1,
          }
        : {}),

      orderBy: {
        id: "desc", 
      },

      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        createdAt: true,
      },
    });

    const nextCursor =
      products.length > 0 ? products[products.length - 1]!.id : null;

    res.json({
      products,
      nextCursor,
      hasMore: products.length === take,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

app.get("/checkBackEnd", healthHandler);
app.get("/products", productsHandler);

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});