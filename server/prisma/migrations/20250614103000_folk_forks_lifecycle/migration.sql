-- Extend lifecycle statuses for Folk & Forks table, order, and payment flows.
ALTER TYPE "TableStatus" ADD VALUE IF NOT EXISTS 'reserved';
ALTER TYPE "TableStatus" ADD VALUE IF NOT EXISTS 'cleaning';

ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'preparing';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'ready';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'served';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'completed';

CREATE TYPE "PaymentStatus" AS ENUM ('unpaid', 'paid');

ALTER TABLE "orders"
  ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'unpaid';

UPDATE "orders"
SET "paymentStatus" = 'paid'
WHERE "status" = 'paid';
