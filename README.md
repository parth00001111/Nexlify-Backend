# Nexlify — Product Catalog API

A high-performance backend API built for the **CodeVector Internship Take-Home Task**.

## Features

- **200,000 products** efficiently seeded using batch inserts
- **Cursor-based pagination** — fast and consistent even when data is changing live
- **Category filtering** across 7 categories
- **Newest first** sorting via `id` (cuid) ordering
- Built with **Bun, TypeScript, Express & Prisma** on **PostgreSQL**

## Key Technical Decisions

**Cursor pagination over offset pagination**
Offset pagination (`LIMIT 20 OFFSET 200`) breaks when new products are inserted — items shift positions and users see duplicates or miss records. Cursor pagination uses the last seen `id` as an anchor, so new inserts never affect pages already being browsed.

**Cursor on `id` (cuid) not `createdAt`**
`createdAt` has duplicate values in bulk-inserted batches — all 10,000 records in a batch share the same timestamp. Using `id` as the cursor is safe because cuid is globally unique and time-ordered, giving stable gap-free pagination.

**Batch seeding (10,000 per batch)**
Inserting all 200,000 records in one `createMany()` call risks memory overflow, DB timeouts, and crashes. Batching into chunks of 10,000 keeps memory flat and lets the DB commit incrementally.

**Database indexes**
```prisma
@@index([createdAt])
@@index([category])
@@index([category, createdAt])
```
The composite index on `(category, createdAt)` means filtered queries skip a full table scan entirely.

## Tech Stack

| Layer      | Technology                      |
|------------|---------------------------------|
| Runtime    | Bun v1.x                        |
| Language   | TypeScript                      |
| Framework  | Express 5                       |
| ORM        | Prisma 7 (with pg adapter)      |
| Database   | PostgreSQL (Neon — serverless)  |
| Pagination | Keyset / cursor-based           |

## Project Structure

```
nexlify-backend/
├── generated/
│   └── prisma/          ← auto-generated Prisma client
├── prisma/
│   ├── schema.prisma    ← data model & indexes
│   └── migrations/      ← migration history
├── index.ts             ← Express server & API routes
├── db.ts                ← Prisma client singleton
├── seed.ts              ← 200k product seeder
├── prisma.config.ts     ← Prisma config
├── .env                 ← DATABASE_URL (not committed)
└── package.json
```

## API Endpoints

### Health check
```
GET /checkBackEnd
```
```json
{ "status": "Nexlify Backend is running" }
```

### Browse products
```
GET /products?limit=20&category=electronics&cursor=...
```

| Query param | Type   | Required | Description                     |
|-------------|--------|----------|---------------------------------|
| `limit`     | number | No       | Products per page (default: 20) |
| `category`  | string | No       | Filter by category              |
| `cursor`    | string | No       | Last `id` from previous page    |

**Categories:** `electronics`, `fashion`, `books`, `home`, `sports`, `beauty`, `toys`

**Response:**
```json
{
  "products": [
    {
      "id": "cmqu5vhm44abjf0v8f0jojosk",
      "name": "Product 200000 - books",
      "category": "books",
      "price": 2978,
      "createdAt": "2026-06-25T23:56:43.087Z"
    }
  ],
  "nextCursor": "cmqu5vhm44ab0f0v8gklomo8n",
  "hasMore": true
}
```

**Paginating through results:**
```
# Page 1
GET /products?limit=20

# Page 2 — paste nextCursor from previous response
GET /products?limit=20&cursor=cmqu5vhm44ab0f0v8gklomo8n

# Filtered
GET /products?category=electronics&limit=50
```

## How to Run Locally

**Prerequisites:** Bun installed — [bun.sh](https://bun.sh)

```bash
# 1. Clone and install
git clone <your-repo-url>
cd nexlify-backend
bun install

# 2. Set up environment
# Create a .env file and add your PostgreSQL connection string:
# DATABASE_URL="postgresql://user:password@host/dbname"

# 3. Generate Prisma client
npx prisma generate

# 4. Run migrations
npx prisma migrate deploy

# 5. Seed 200,000 products
bun seed.ts

# 6. Start the server
bun index.ts
```

Server runs at `http://localhost:3000`

## How I Used AI

I used ai only for the **frontend UI** (React + TypeScript).

The frontend was explicitly marked as a bonus/optional task in the brief,
and the instructions stated "design it entirely with AI if you want —
we don't read or grade UI code." So I used Claude to generate the
React component, category filter, product cards, and pagination UI.

All backend work was done independently:
- Cursor pagination strategy and choosing `id` over `createdAt` as the cursor field
- Batch seeding design (10k chunks to avoid memory and timeout issues)
- Index decisions on `(category, createdAt)`
- Express route logic and error handling
- Prisma schema and adapter setup
- Debugging TypeScript and ESM config issues

## What I'd Improve With More Time

- **Redis caching** for hot category queries (e.g. `electronics` page 1 gets hit constantly)
- **Search by name** using PostgreSQL `tsvector` full-text search
- **Rate limiting** with a sliding window to prevent abuse
- **Docker setup** for a fully reproducible local environment
