import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { FoldersService } from 'src/folders/folders.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ParsedCursorQuery, paginateResults } from 'src/common/pagination/pagination.util';

type ModuleSort = 'date' | 'az' | 'favs';

@Injectable()
export class ModulesService {
  constructor(private readonly prisma: PrismaService,
    private readonly foldersService: FoldersService
  ) { }
  async create(userId: string, createModuleDto: CreateModuleDto) {
    if (createModuleDto.folderId) {
      const folder = await this.foldersService.findOne(userId, createModuleDto.folderId);
      if (!folder) throw new NotFoundException('Folder not found or not belongs to you');
    }
    return this.prisma.module.create({
      data: {
        name: createModuleDto.name,
        isFavorite: createModuleDto.isFavorite ?? false,
        folders: createModuleDto.folderId ? {
          connect: { id: createModuleDto.folderId },
        } : undefined,
        flashcards: createModuleDto.flashcards?.length ? {
          create: createModuleDto.flashcards.map(flashcard => ({
            term: flashcard.term,
            definition: flashcard.definition,
          })),
        } : undefined,
        userId,
        authorId: userId,
      },
    });
  }

  findAll(userId: string, query: ParsedCursorQuery & { sort?: ModuleSort }) {
    const { cursor, limit, search, sort = 'date' } = query;

    const orderBy =
      sort === 'az'
        ? [{ name: 'asc' as const }, { id: 'asc' as const }]
        : [{ createdAt: 'desc' as const }, { id: 'asc' as const }];

    return this.prisma.module
      .findMany({
        where: {
          userId,
          ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
          ...(sort === 'favs' ? { isFavorite: true } : {}),
        },
        orderBy,
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: {
          folders: {
            select: { id: true },
          },
          user: {
            select: { id: true, username: true, avatarUrl: true },
          },
          author: {
            select: { id: true, username: true, avatarUrl: true },
          },
          flashcards: {
            select: { status: true },
          },
          _count: {
            select: { flashcards: true },
          },
        },
      })
      .then((rows) => paginateResults(rows, limit));
  }

  findOne(userId: string, id: string) {
    return this.prisma.module.findFirst({
      where: { id, OR: [{ userId }, { isPublic: true }] },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
        author: {
          select: { id: true, username: true, avatarUrl: true },
        },
        folders: {
          select: { id: true },
        },
        _count: {
          select: { flashcards: true },
        },
      },
    });
  }

  async update(userId: string, id: string, updateModuleDto: UpdateModuleDto) {

    const module = await this.prisma.module.findFirst({
      where: { id, userId },
    });
    if (!module) throw new NotFoundException('Module not found or not belongs to you');

    if (updateModuleDto.folderId) {
      const folder = await this.prisma.folder.findFirst({
        where: { id: updateModuleDto.folderId, userId },
      });

      if (!folder) {
        throw new NotFoundException('New folder is not found or not belongs to you');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      if (updateModuleDto.flashcards) {
        await tx.flashcard.deleteMany({
          where: { moduleId: id },
        });
      }

      return tx.module.update({
        where: { id },
        data: {
          name: updateModuleDto.name,
          isFavorite: updateModuleDto.isFavorite,
          isPublic: updateModuleDto.isPublic,
          folders: updateModuleDto.folderId ? {
            connect: { id: updateModuleDto.folderId },
          } : undefined,
          flashcards: updateModuleDto.flashcards ? {
            create: updateModuleDto.flashcards.map(card => ({
              term: card.term,
              definition: card.definition,
            })),
          } : undefined,
        },
        include: { flashcards: true },
      });
    });
  }

  async remove(userId: string, id: string) {
    const module = await this.prisma.module.findFirst({
      where: { id, userId },
    });
    if (!module) throw new NotFoundException('Module not found or not belongs to you');

    await this.prisma.flashcard.deleteMany({ where: { moduleId: id } });

    return this.prisma.module.delete({
      where: { id },
    });
  }


  findPublic(query: ParsedCursorQuery & { excludeUserId?: string }) {
    const { cursor, limit, search, excludeUserId } = query;

    return this.prisma.module
      .findMany({
        where: {
          isPublic: true,
          ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
          ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
        },
        orderBy: [{ updatedAt: 'desc' as const }, { id: 'asc' as const }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
          author: { select: { id: true, username: true, avatarUrl: true } },
          _count: { select: { flashcards: true } },
        },
      })
      .then((rows) => paginateResults(rows, limit));
  }

  async getStats(userId: string) {
    const [totalModules, modules] = await Promise.all([
      this.prisma.module.count({ where: { userId } }),
      this.prisma.module.findMany({
        where: { userId },
        select: { id: true, name: true, updatedAt: true, flashcards: { select: { status: true } } },
      }),
    ]);

    const cardsLearned = modules.reduce(
      (sum, m) => sum + m.flashcards.filter((f) => f.status === 'KNOWN').length,
      0,
    );

    const continueLearning = modules
      .map((m) => {
        const statuses = m.flashcards.map((f) => f.status);
        const started = statuses.some((s) => s !== 'UNSTUDIED');
        const unfinished = statuses.some((s) => s !== 'KNOWN');
        return {
          id: m.id,
          name: m.name,
          updatedAt: m.updatedAt,
          known: statuses.filter((s) => s === 'KNOWN').length,
          total: statuses.length,
          inProgress: started && unfinished,
        };
      })
      .filter((m) => m.inProgress)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5)
      .map(({ inProgress, ...rest }) => rest);

    return { totalModules, cardsLearned, continueLearning };
  }

  async saveToLibrary(userId: string, id: string) {
    const originalModule = await this.prisma.module.findFirst({
      where: { id, isPublic: true },
      include: { flashcards: true },
    });

    if (!originalModule) {
      throw new NotFoundException('Public module not found');
    }

    if (originalModule.userId === userId) {
      throw new BadRequestException('You cannot save your own module to your library');
    }

    return this.prisma.module.create({
      data: {
        name: originalModule.name,
        userId: userId,
        authorId: originalModule.authorId,
        authorUsername: originalModule.authorUsername,
        isPublic: false,
        isFavorite: false,

        flashcards: {
          create: originalModule.flashcards.map((card) => ({
            term: card.term,
            definition: card.definition,
          })),
        },
      },
      include: { flashcards: true },
    });
  }

}



