-- CreateEnum
CREATE TYPE "VideoSessionStatus" AS ENUM ('SCHEDULED', 'WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "WebsiteConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "blocks" JSONB NOT NULL,
    "settings" JSONB,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsiteConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bookingId" TEXT,
    "onlineOrderId" TEXT,
    "clinicianId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "status" "VideoSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "roomName" TEXT NOT NULL,
    "roomSid" TEXT,
    "clinicianToken" TEXT,
    "patientToken" TEXT,
    "recordingUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebsiteConfig_tenantId_key" ON "WebsiteConfig"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoSession_bookingId_key" ON "VideoSession"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoSession_roomName_key" ON "VideoSession"("roomName");

-- CreateIndex
CREATE INDEX "VideoSession_tenantId_idx" ON "VideoSession"("tenantId");

-- CreateIndex
CREATE INDEX "VideoSession_clinicianId_idx" ON "VideoSession"("clinicianId");

-- CreateIndex
CREATE INDEX "VideoSession_patientId_idx" ON "VideoSession"("patientId");

-- CreateIndex
CREATE INDEX "VideoSession_status_idx" ON "VideoSession"("status");

-- AddForeignKey
ALTER TABLE "WebsiteConfig" ADD CONSTRAINT "WebsiteConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoSession" ADD CONSTRAINT "VideoSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
