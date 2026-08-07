-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "authorId" TEXT;

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: existing modules are authored by their owner
UPDATE "Module" SET "authorId" = "userId";
