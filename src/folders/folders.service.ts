import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ParsedCursorQuery, paginateResults } from 'src/common/pagination/pagination.util';

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

  findAll(userId: string, query: ParsedCursorQuery) {
    const { cursor, limit, search } = query;

    return this.prisma.folder
      .findMany({
        where: {
          userId,
          ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
        },
        orderBy: [{ createdAt: 'desc' as const }, { id: 'asc' as const }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: { _count: { select: { modules: true } } },
      })
      .then((rows) => paginateResults(rows, limit));
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

  private async checkModulesOwnership(userId: string, moduleIds: string[]) {
    const ownedCount = await this.prisma.module.count({
      where: { id: { in: moduleIds }, userId },
    });
    if (ownedCount !== moduleIds.length) {
      throw new ForbiddenException('One or more modules do not belong to you');
    }
  }

  async addModules(userId: string, folderId: string, moduleIds: string[]) {
    await this.checkFolderOwnership(userId, folderId);
    await this.checkModulesOwnership(userId, moduleIds);

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
    await this.checkModulesOwnership(userId, moduleIds);

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