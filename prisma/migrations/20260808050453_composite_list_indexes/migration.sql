-- DropIndex
DROP INDEX "Flashcard_moduleId_idx";

-- DropIndex
DROP INDEX "Folder_userId_idx";

-- DropIndex
DROP INDEX "Module_userId_idx";

-- CreateIndex
CREATE INDEX "Flashcard_moduleId_status_idx" ON "Flashcard"("moduleId", "status");

-- CreateIndex
CREATE INDEX "Folder_userId_createdAt_id_idx" ON "Folder"("userId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Module_userId_createdAt_id_idx" ON "Module"("userId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Module_userId_name_id_idx" ON "Module"("userId", "name", "id");

-- CreateIndex
CREATE INDEX "Module_userId_updatedAt_idx" ON "Module"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Module_isPublic_updatedAt_id_idx" ON "Module"("isPublic", "updatedAt", "id");

-- CreateIndex
CREATE INDEX "Module_authorId_idx" ON "Module"("authorId");

-- CreateIndex
CREATE INDEX "StudyEvent_moduleId_idx" ON "StudyEvent"("moduleId");

-- CreateIndex
CREATE INDEX "StudyEvent_flashcardId_idx" ON "StudyEvent"("flashcardId");
