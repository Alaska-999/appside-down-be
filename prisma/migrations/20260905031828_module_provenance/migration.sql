-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "divergedAt" TIMESTAMP(3),
ADD COLUMN     "sourceModuleId" TEXT;

-- CreateIndex
CREATE INDEX "Module_userId_sourceModuleId_idx" ON "Module"("userId", "sourceModuleId");

-- CreateIndex
CREATE INDEX "Module_sourceModuleId_idx" ON "Module"("sourceModuleId");

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_sourceModuleId_fkey" FOREIGN KEY ("sourceModuleId") REFERENCES "Module"("id") ON DELETE SET NULL ON UPDATE CASCADE;
