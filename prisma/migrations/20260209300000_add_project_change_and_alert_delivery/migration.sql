-- CreateTable
CREATE TABLE "project_changes" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT,
    "changeType" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_changes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_changes_projectId_createdAt_idx" ON "project_changes"("projectId", "createdAt");

-- AddForeignKey
ALTER TABLE "project_changes" ADD CONSTRAINT "project_changes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "alert_deliveries" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "alert_deliveries_telegramId_idx" ON "alert_deliveries"("telegramId");

-- CreateIndex
CREATE INDEX "alert_deliveries_alertType_idx" ON "alert_deliveries"("alertType");
