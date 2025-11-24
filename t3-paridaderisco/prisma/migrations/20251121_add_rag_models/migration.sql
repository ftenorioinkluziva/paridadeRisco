-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum for ResourceCategory
DO $$ BEGIN
 CREATE TYPE "ResourceCategory" AS ENUM ('STRATEGY', 'MARKET_ANALYSIS', 'INVESTMENT_GUIDE', 'RISK_PARITY', 'ASSET_INFO', 'ECONOMIC_SCENARIO');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateEnum for NotificationType
DO $$ BEGIN
 CREATE TYPE "NotificationType" AS ENUM ('INSIGHT', 'WARNING', 'OPPORTUNITY', 'REBALANCE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateEnum for NotificationPriority
DO $$ BEGIN
 CREATE TYPE "NotificationPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateTable Resource
CREATE TABLE IF NOT EXISTS "Resource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" "ResourceCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable Embedding
CREATE TABLE IF NOT EXISTS "Embedding" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,

    CONSTRAINT "Embedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable Notification
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "priority" "NotificationPriority" NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Resource_category_idx" ON "Resource"("category");
CREATE INDEX IF NOT EXISTS "Resource_createdAt_idx" ON "Resource"("createdAt");
CREATE INDEX IF NOT EXISTS "Embedding_resourceId_idx" ON "Embedding"("resourceId");
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE INDEX IF NOT EXISTS "Notification_read_idx" ON "Notification"("read");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
