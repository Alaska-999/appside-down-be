/*
  Warnings:

  - You are about to drop the column `tags` on the `Folder` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "folderId" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ModuleToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ModuleToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Tag_folderId_idx" ON "Tag"("folderId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_folderId_name_key" ON "Tag"("folderId", "name");

-- CreateIndex
CREATE INDEX "_ModuleToTag_B_index" ON "_ModuleToTag"("B");

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ModuleToTag" ADD CONSTRAINT "_ModuleToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ModuleToTag" ADD CONSTRAINT "_ModuleToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing folder tag names into Tag rows
INSERT INTO "Tag" ("id", "name", "folderId")
SELECT gen_random_uuid()::text, t.name, f."id"
FROM "Folder" f, LATERAL unnest(f."tags") AS t(name)
WHERE btrim(t.name) <> ''
ON CONFLICT ("folderId", "name") DO NOTHING;

-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "tags";
