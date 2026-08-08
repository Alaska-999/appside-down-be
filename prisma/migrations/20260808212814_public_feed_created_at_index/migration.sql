-- DropIndex
DROP INDEX "Module_isPublic_updatedAt_id_idx";

-- CreateIndex
CREATE INDEX "Module_isPublic_createdAt_id_idx" ON "Module"("isPublic", "createdAt", "id");

