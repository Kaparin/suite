-- CreateEnum
CREATE TYPE "TrustRating" AS ENUM ('A', 'B', 'C', 'D', 'F');

-- CreateTable
CREATE TABLE "trust_scores" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "verificationScore" INTEGER NOT NULL DEFAULT 0,
    "liquidityScore" INTEGER NOT NULL DEFAULT 0,
    "holderScore" INTEGER NOT NULL DEFAULT 0,
    "activityScore" INTEGER NOT NULL DEFAULT 0,
    "contractScore" INTEGER NOT NULL DEFAULT 0,
    "communityScore" INTEGER NOT NULL DEFAULT 0,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "rating" "TrustRating" NOT NULL DEFAULT 'F',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trust_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trust_scores_projectId_key" ON "trust_scores"("projectId");

-- AddForeignKey
ALTER TABLE "trust_scores" ADD CONSTRAINT "trust_scores_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
