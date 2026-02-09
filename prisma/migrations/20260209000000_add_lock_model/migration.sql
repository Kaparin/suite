-- CreateEnum
CREATE TYPE "LockTier" AS ENUM ('EXPLORER', 'BUILDER', 'FOUNDER', 'GOVERNOR');

-- CreateEnum
CREATE TYPE "LockStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'UNLOCKED', 'VIOLATED');

-- CreateTable
CREATE TABLE "locks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "tier" "LockTier" NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "lockStartDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockEndDate" TIMESTAMP(3) NOT NULL,
    "status" "LockStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "locks_userId_idx" ON "locks"("userId");

-- CreateIndex
CREATE INDEX "locks_walletAddress_idx" ON "locks"("walletAddress");

-- CreateIndex
CREATE INDEX "locks_status_idx" ON "locks"("status");

-- AddForeignKey
ALTER TABLE "locks" ADD CONSTRAINT "locks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
