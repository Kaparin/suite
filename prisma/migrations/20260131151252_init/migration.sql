-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RiskFlagType" AS ENUM ('TOO_NEW', 'NO_SOCIALS', 'HIGH_CONCENTRATION', 'LOW_LIQUIDITY', 'SUDDEN_PUMP', 'SUDDEN_DUMP', 'HONEYPOT_SUSPECT', 'UNLOCKED_SUPPLY');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AiGenerationType" AS ENUM ('TOKENOMICS', 'DESCRIPTION', 'FAQ', 'LAUNCH_PLAN', 'PROMO', 'FULL_PACKAGE');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('NEW_TOKEN', 'VOLUME_SPIKE', 'PRICE_CHANGE', 'RISK_FLAG', 'TOKEN_UPDATE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "telegramId" TEXT,
    "walletAddress" TEXT,
    "username" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
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
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
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

-- CreateIndex
CREATE UNIQUE INDEX "users_telegramId_key" ON "users"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "users_walletAddress_key" ON "users"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "projects_tokenAddress_key" ON "projects"("tokenAddress");

-- CreateIndex
CREATE UNIQUE INDEX "token_metrics_projectId_date_key" ON "token_metrics"("projectId", "date");

-- CreateIndex
CREATE INDEX "ai_generations_promptHash_idx" ON "ai_generations"("promptHash");

-- CreateIndex
CREATE UNIQUE INDEX "alert_subscriptions_telegramId_alertType_tokenAddress_key" ON "alert_subscriptions"("telegramId", "alertType", "tokenAddress");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_metrics" ADD CONSTRAINT "token_metrics_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_flags" ADD CONSTRAINT "risk_flags_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
