-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'UPCOMING', 'PRESALE', 'PUBLISHED', 'LAUNCHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RiskFlagType" AS ENUM ('TOO_NEW', 'NO_SOCIALS', 'HIGH_CONCENTRATION', 'LOW_LIQUIDITY', 'SUDDEN_PUMP', 'SUDDEN_DUMP', 'HONEYPOT_SUSPECT', 'UNLOCKED_SUPPLY');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AiGenerationType" AS ENUM ('TOKENOMICS', 'DESCRIPTION', 'FAQ', 'LAUNCH_PLAN', 'PROMO', 'FULL_PACKAGE');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('NEW_TOKEN', 'VOLUME_SPIKE', 'PRICE_CHANGE', 'RISK_FLAG', 'TOKEN_UPDATE');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('ROCKET', 'FIRE', 'HEART', 'EYES', 'WARNING');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "telegramId" TEXT,
    "telegramUsername" TEXT,
    "telegramPhotoUrl" TEXT,
    "telegramFirstName" TEXT,
    "telegramAuthDate" TIMESTAMP(3),
    "username" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "label" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "creatorWallet" TEXT,
    "tokenAddress" TEXT,
    "name" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "logo" TEXT,
    "descriptionShort" TEXT,
    "descriptionLong" TEXT,
    "links" JSONB,
    "tokenomics" JSONB,
    "launchPlan" JSONB,
    "faq" JSONB,
    "promoTexts" JSONB,
    "decimals" INTEGER NOT NULL DEFAULT 6,
    "initialSupply" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "presaleStartDate" TIMESTAMP(3),
    "presaleEndDate" TIMESTAMP(3),
    "estimatedLaunchDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_metrics" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "txCount" INTEGER NOT NULL DEFAULT 0,
    "volumeEstimate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "holdersEstimate" INTEGER NOT NULL DEFAULT 0,
    "priceUsd" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_flags" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "flagType" "RiskFlagType" NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "details" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_generations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AiGenerationType" NOT NULL,
    "promptHash" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_subscriptions" (
    "id" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "alertType" "AlertType" NOT NULL,
    "tokenAddress" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reactions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_verifications" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "wallet_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_telegramId_key" ON "users"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_address_key" ON "wallets"("address");

-- CreateIndex
CREATE INDEX "wallets_userId_idx" ON "wallets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "projects_tokenAddress_key" ON "projects"("tokenAddress");

-- CreateIndex
CREATE UNIQUE INDEX "token_metrics_projectId_date_key" ON "token_metrics"("projectId", "date");

-- CreateIndex
CREATE INDEX "ai_generations_promptHash_idx" ON "ai_generations"("promptHash");

-- CreateIndex
CREATE UNIQUE INDEX "alert_subscriptions_telegramId_alertType_tokenAddress_key" ON "alert_subscriptions"("telegramId", "alertType", "tokenAddress");

-- CreateIndex
CREATE INDEX "comments_projectId_createdAt_idx" ON "comments"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "reactions_projectId_idx" ON "reactions"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_projectId_userId_type_key" ON "reactions"("projectId", "userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_verifications_walletAddress_key" ON "wallet_verifications"("walletAddress");

-- CreateIndex
CREATE INDEX "wallet_verifications_walletAddress_idx" ON "wallet_verifications"("walletAddress");

-- CreateIndex
CREATE INDEX "wallet_verifications_code_idx" ON "wallet_verifications"("code");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_metrics" ADD CONSTRAINT "token_metrics_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_flags" ADD CONSTRAINT "risk_flags_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

