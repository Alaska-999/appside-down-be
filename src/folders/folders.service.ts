import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FoldersService {
  constructor(private readonly prisma: PrismaService) { }

  private readonly folderPayload = {
    modules: {
      include: {
        _count: { select: { flashcards: true } },
        author: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    },
  };

  create(userId: string, createFolderDto: CreateFolderDto) {
    return this.prisma.folder.create({
      data: {
        ...createFolderDto,
        userId,
      },
      include: this.folderPayload,
    });
  }

  findAll(userId: string) {
    return this.prisma.folder.findMany({
      where: { userId },
      include: this.folderPayload,
    });
  }

  findOne(userId: string, id: string) {
    return this.prisma.folder.findFirst({
      where: { id, userId },
      include: this.folderPayload,
    });
  }

  private async checkFolderOwnership(userId: string, id: string) {
    const folder = await this.prisma.folder.findFirst({ where: { id, userId } });
    if (!folder) throw new NotFoundException('Folder not found or does not belong to you');
    return folder;
  }

  async update(userId: string, id: string, updateFolderDto: UpdateFolderDto) {
    await this.checkFolderOwnership(userId, id);

    return this.prisma.folder.update({
      where: { id },
      data: updateFolderDto,
      include: this.folderPayload,
    });
  }

  async remove(userId: string, id: string) {
    await this.checkFolderOwnership(userId, id);

    return this.prisma.folder.delete({
      where: { id },
    });
  }

  async addModules(userId: string, folderId: string, moduleIds: string[]) {
    await this.checkFolderOwnership(userId, folderId);

    return this.prisma.folder.update({
      where: { id: folderId },
      data: {
        modules: {
          connect: moduleIds.map((id) => ({ id })),
        },
      },
      include: this.folderPayload,
    });
  }

  async removeModules(userId: string, folderId: string, moduleIds: string[]) {
    await this.checkFolderOwnership(userId, folderId);

    return this.prisma.folder.update({
      where: { id: folderId },
      data: {
        modules: {
          disconnect: moduleIds.map((id) => ({ id })),
        },
      },
      include: this.folderPayload,
    });
  }
}