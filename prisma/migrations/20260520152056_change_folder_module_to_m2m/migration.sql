-- DropForeignKey
ALTER TABLE "Module" DROP CONSTRAINT "Module_folderId_fkey";

-- CreateTable
CREATE TABLE "_FolderToModule" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FolderToModule_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_FolderToModule_B_index" ON "_FolderToModule"("B");

-- AddForeignKey
ALTER TABLE "_FolderToModule" ADD CONSTRAINT "_FolderToModule_A_fkey" FOREIGN KEY ("A") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FolderToModule" ADD CONSTRAINT "_FolderToModule_B_fkey" FOREIGN KEY ("B") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;
