import { ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ParsedCursorQuery, paginateResults } from 'src/common/pagination/pagination.util';
import { attachModuleProgress } from 'src/common/progress/module-progress';

@Injectable()
export class FoldersService {
  private readonly logger = new Logger(FoldersService.name);

  constructor(private readonly prisma: PrismaService) { }

  private folderPayload(folderId: string) {
    return {
      tags: {
        orderBy: { createdAt: 'asc' as const },
        include: { _count: { select: { modules: true } } },
      },
      modules: {
        include: {
          _count: { select: { flashcards: true } },
          author: {
            select: { id: true, username: true, avatarUrl: true },
          },
          tags: { where: { folderId }, select: { id: true, name: true } },
        },
      },
    };
  }

  async create(userId: string, createFolderDto: CreateFolderDto) {
    const { tags, ...data } = createFolderDto;
    const tagNames = [...new Set((tags ?? []).map((t) => t.trim()).filter(Boolean))];
    const created = await this.prisma.folder.create({
      data: {
        ...data,
        userId,
        tags: { create: tagNames.map((name) => ({ name })) },
      },
    });
    const folder = await this.prisma.folder.findUniqueOrThrow({
      where: { id: created.id },
      include: this.folderPayload(created.id),
    });
    this.logger.log(`Folder created (id=${folder.id}, userId=${userId})`);
    return folder;
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

  async findOne(userId: string, id: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { id, userId },
      include: this.folderPayload(id),
    });
    if (!folder) return folder;
    return { ...folder, modules: await attachModuleProgress(this.prisma, folder.modules) };
  }

  private async checkFolderOwnership(userId: string, id: string) {
    const folder = await this.prisma.folder.findFirst({ where: { id, userId } });
    if (!folder) {
      this.logger.warn(`Folder ownership check failed (id=${id}, userId=${userId})`);
      throw new NotFoundException('Folder not found or does not belong to you');
    }
    return folder;
  }

  async update(userId: string, id: string, updateFolderDto: UpdateFolderDto) {
    await this.checkFolderOwnership(userId, id);

    const folder = await this.prisma.folder.update({
      where: { id },
      data: updateFolderDto,
      include: this.folderPayload(id),
    });
    this.logger.log(`Folder updated (id=${id})`);
    return folder;
  }

  async remove(userId: string, id: string) {
    await this.checkFolderOwnership(userId, id);

    const folder = await this.prisma.folder.delete({
      where: { id },
    });
    this.logger.log(`Folder deleted (id=${id})`);
    return folder;
  }

  private async checkModulesOwnership(userId: string, moduleIds: string[]) {
    const ownedCount = await this.prisma.module.count({
      where: { id: { in: moduleIds }, userId },
    });
    if (ownedCount !== moduleIds.length) {
      this.logger.warn(`Module ownership check failed (userId=${userId}, requested=${moduleIds.length}, owned=${ownedCount})`);
      throw new ForbiddenException('One or more modules do not belong to you');
    }
  }

  async addModules(userId: string, folderId: string, moduleIds: string[]) {
    await this.checkFolderOwnership(userId, folderId);
    await this.checkModulesOwnership(userId, moduleIds);

    const folder = await this.prisma.folder.update({
      where: { id: folderId },
      data: {
        modules: {
          connect: moduleIds.map((id) => ({ id })),
        },
      },
      include: this.folderPayload(folderId),
    });
    this.logger.log(`Modules added to folder (folderId=${folderId}, count=${moduleIds.length})`);
    return folder;
  }

  async removeModules(userId: string, folderId: string, moduleIds: string[]) {
    await this.checkFolderOwnership(userId, folderId);
    await this.checkModulesOwnership(userId, moduleIds);

    const folder = await this.prisma.folder.update({
      where: { id: folderId },
      data: {
        modules: {
          disconnect: moduleIds.map((id) => ({ id })),
        },
      },
      include: this.folderPayload(folderId),
    });
    this.logger.log(`Modules removed from folder (folderId=${folderId}, count=${moduleIds.length})`);
    return folder;
  }

  async createTag(userId: string, folderId: string, name: string) {
    await this.checkFolderOwnership(userId, folderId);
    const trimmed = name.trim();
    const existing = await this.prisma.tag.findUnique({ where: { folderId_name: { folderId, name: trimmed } } });
    if (existing) throw new ConflictException('Tag with this name already exists in the folder');
    const tag = await this.prisma.tag.create({
      data: { folderId, name: trimmed },
      include: { _count: { select: { modules: true } } },
    });
    this.logger.log(`Tag created (folderId=${folderId}, tagId=${tag.id})`);
    return tag;
  }

  private async checkTagInFolder(folderId: string, tagId: string) {
    const tag = await this.prisma.tag.findFirst({ where: { id: tagId, folderId } });
    if (!tag) {
      this.logger.warn(`Tag not found in folder (folderId=${folderId}, tagId=${tagId})`);
      throw new NotFoundException('Tag not found in this folder');
    }
    return tag;
  }

  async renameTag(userId: string, folderId: string, tagId: string, name: string) {
    await this.checkFolderOwnership(userId, folderId);
    await this.checkTagInFolder(folderId, tagId);
    const trimmed = name.trim();
    const clash = await this.prisma.tag.findUnique({ where: { folderId_name: { folderId, name: trimmed } } });
    if (clash && clash.id !== tagId) throw new ConflictException('Tag with this name already exists in the folder');
    const tag = await this.prisma.tag.update({
      where: { id: tagId },
      data: { name: trimmed },
      include: { _count: { select: { modules: true } } },
    });
    this.logger.log(`Tag renamed (folderId=${folderId}, tagId=${tagId})`);
    return tag;
  }

  async deleteTag(userId: string, folderId: string, tagId: string) {
    await this.checkFolderOwnership(userId, folderId);
    await this.checkTagInFolder(folderId, tagId);
    const tag = await this.prisma.tag.delete({ where: { id: tagId } });
    this.logger.log(`Tag deleted (folderId=${folderId}, tagId=${tagId})`);
    return tag;
  }

  async setModuleTags(userId: string, folderId: string, moduleId: string, tagIds: string[]) {
    await this.checkFolderOwnership(userId, folderId);
    await this.checkModulesOwnership(userId, [moduleId]);
    const inFolder = await this.prisma.module.count({ where: { id: moduleId, folders: { some: { id: folderId } } } });
    if (!inFolder) throw new NotFoundException('Module is not in this folder');
    const uniqueIds = [...new Set(tagIds)];
    const validTags = await this.prisma.tag.count({ where: { id: { in: uniqueIds }, folderId } });
    if (validTags !== uniqueIds.length) throw new NotFoundException('One or more tags do not belong to this folder');
    const folderTags = await this.prisma.tag.findMany({ where: { folderId }, select: { id: true } });
    const module = await this.prisma.module.update({
      where: { id: moduleId },
      data: {
        tags: {
          disconnect: folderTags.filter((t) => !uniqueIds.includes(t.id)).map((t) => ({ id: t.id })),
          connect: uniqueIds.map((id) => ({ id })),
        },
      },
      select: { id: true, tags: { select: { id: true, name: true, folderId: true } } },
    });
    this.logger.log(`Module tags set (folderId=${folderId}, moduleId=${moduleId}, count=${uniqueIds.length})`);
    return module;
  }
}
