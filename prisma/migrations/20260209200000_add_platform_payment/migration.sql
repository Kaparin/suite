-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('PRO_SUBSCRIPTION', 'PROJECT_VERIFICATION', 'PROJECT_PROMOTION');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'EXPIRED');

-- CreateTable
CREATE TABLE "platform_payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PaymentType" NOT NULL,
    "amount" TEXT NOT NULL,
    "txHash" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3),
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "platform_payments_userId_idx" ON "platform_payments"("userId");

-- CreateIndex
CREATE INDEX "platform_payments_txHash_idx" ON "platform_payments"("txHash");

-- CreateIndex
CREATE INDEX "platform_payments_status_idx" ON "platform_payments"("status");

-- AddForeignKey
ALTER TABLE "platform_payments" ADD CONSTRAINT "platform_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
