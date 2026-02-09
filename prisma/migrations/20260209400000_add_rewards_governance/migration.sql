-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('TOKEN_REVIEW', 'SCAM_REPORT', 'PROJECT_UPDATE', 'DAILY_ACTIVITY');
CREATE TYPE "RewardStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED');
CREATE TYPE "ProposalType" AS ENUM ('FEATURE_PROJECT', 'DELIST_PROJECT', 'PLATFORM_CHANGE', 'COMMUNITY_PICK');
CREATE TYPE "ProposalStatus" AS ENUM ('ACTIVE', 'PASSED', 'REJECTED', 'EXECUTED', 'EXPIRED');

-- CreateTable: reward_events
CREATE TABLE "reward_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "RewardType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "RewardStatus" NOT NULL DEFAULT 'PENDING',
    "projectId" TEXT,
    "commentId" TEXT,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reward_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "reward_events_userId_idx" ON "reward_events"("userId");
CREATE INDEX "reward_events_status_idx" ON "reward_events"("status");
ALTER TABLE "reward_events" ADD CONSTRAINT "reward_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: proposals
CREATE TABLE "proposals" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "ProposalType" NOT NULL,
    "projectId" TEXT,
    "quorum" INTEGER NOT NULL DEFAULT 1000,
    "threshold" INTEGER NOT NULL DEFAULT 51,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'ACTIVE',
    "votesFor" INTEGER NOT NULL DEFAULT 0,
    "votesAgainst" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "proposals_status_idx" ON "proposals"("status");
CREATE INDEX "proposals_endDate_idx" ON "proposals"("endDate");
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: votes
CREATE TABLE "votes" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inFavor" BOOLEAN NOT NULL,
    "votingPower" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "votes_proposalId_userId_key" ON "votes"("proposalId", "userId");
CREATE INDEX "votes_proposalId_idx" ON "votes"("proposalId");
ALTER TABLE "votes" ADD CONSTRAINT "votes_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "votes" ADD CONSTRAINT "votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
