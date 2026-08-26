import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { FoldersService } from 'src/folders/folders.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ParsedCursorQuery, paginateResults } from 'src/common/pagination/pagination.util';

type ModuleSort = 'date' | 'az' | 'favs';

@Injectable()
export class ModulesService {
  private readonly logger = new Logger(ModulesService.name);

  constructor(private readonly prisma: PrismaService,
    private readonly foldersService: FoldersService
  ) { }
  async create(userId: string, createModuleDto: CreateModuleDto) {
    if (createModuleDto.folderId) {
      const folder = await this.foldersService.findOne(userId, createModuleDto.folderId);
      if (!folder) {
        this.logger.warn(`Module create rejected: folder not found (folderId=${createModuleDto.folderId}, userId=${userId})`);
        throw new NotFoundException('Folder not found or not belongs to you');
      }
    }
    const module = await this.prisma.module.create({
      data: {
        name: createModuleDto.name,
        description: createModuleDto.description,
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
    this.logger.log(`Module created (id=${module.id}, userId=${userId})`);
    return module;
  }

  private async attachProgress<T extends { id: string }>(modules: T[]) {
    if (!modules.length) return modules.map((m) => ({ ...m, progress: this.emptyProgress() }));

    const rows = await this.prisma.flashcard.groupBy({
      by: ['moduleId', 'status'],
      where: { moduleId: { in: modules.map((m) => m.id) } },
      _count: { _all: true },
    });

    const byModule = new Map<string, Record<string, number>>();
    for (const row of rows) {
      const entry = byModule.get(row.moduleId) ?? {};
      entry[row.status] = row._count._all;
      byModule.set(row.moduleId, entry);
    }

    return modules.map((m) => {
      const counts = byModule.get(m.id) ?? {};
      const known = counts.KNOWN ?? 0;
      const learning = counts.STILL_LEARNING ?? 0;
      const unstudied = counts.UNSTUDIED ?? 0;
      return {
        ...m,
        progress: { known, learning, unstudied, total: known + learning + unstudied },
      };
    });
  }

  private emptyProgress() {
    return { known: 0, learning: 0, unstudied: 0, total: 0 };
  }

  async findAll(userId: string, query: ParsedCursorQuery & { sort?: ModuleSort }) {
    const { cursor, limit, search, sort = 'date' } = query;

    const orderBy =
      sort === 'az'
        ? [{ name: 'asc' as const }, { id: 'asc' as const }]
        : [{ createdAt: 'desc' as const }, { id: 'asc' as const }];

    const page = await this.prisma.module
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
          _count: {
            select: { flashcards: true },
          },
        },
      })
      .then((rows) => paginateResults(rows, limit));

    return { ...page, data: await this.attachProgress(page.data) };
  }

  async findOne(userId: string, id: string) {
    const module = await this.prisma.module.findFirst({
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

    if (!module) return module;

    const [withProgress] = await this.attachProgress([module]);
    return withProgress;
  }

  async update(userId: string, id: string, updateModuleDto: UpdateModuleDto) {

    const module = await this.prisma.module.findFirst({
      where: { id, userId },
    });
    if (!module) {
      this.logger.warn(`Module update rejected: not found (id=${id}, userId=${userId})`);
      throw new NotFoundException('Module not found or not belongs to you');
    }

    if (updateModuleDto.folderId) {
      const folder = await this.prisma.folder.findFirst({
        where: { id: updateModuleDto.folderId, userId },
      });

      if (!folder) {
        this.logger.warn(`Module update rejected: new folder not found (folderId=${updateModuleDto.folderId}, userId=${userId})`);
        throw new NotFoundException('New folder is not found or not belongs to you');
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const incoming = updateModuleDto.flashcards;
      if (incoming) {
        const existing = await tx.flashcard.findMany({
          where: { moduleId: id },
          select: { id: true, term: true, definition: true },
        });
        const existingById = new Map(existing.map((card) => [card.id, card]));

        const toUpdate = incoming.filter((card) => card.id && existingById.has(card.id));
        const toCreate = incoming.filter((card) => !card.id || !existingById.has(card.id));
        const keptIds = new Set(toUpdate.map((card) => card.id));
        const toDeleteIds = existing.map((card) => card.id).filter((cardId) => !keptIds.has(cardId));

        for (const card of toUpdate) {
          const current = existingById.get(card.id!)!;
          if (current.term === card.term && current.definition === card.definition) continue;
          await tx.flashcard.update({
            where: { id: card.id },
            data: { term: card.term, definition: card.definition },
          });
        }
        if (toCreate.length) {
          await tx.flashcard.createMany({
            data: toCreate.map((card) => ({
              moduleId: id,
              term: card.term,
              definition: card.definition,
            })),
          });
        }
        if (toDeleteIds.length) {
          await tx.flashcard.deleteMany({
            where: { id: { in: toDeleteIds }, moduleId: id },
          });
        }
      }

      return tx.module.update({
        where: { id },
        data: {
          name: updateModuleDto.name,
          description: updateModuleDto.description,
          isFavorite: updateModuleDto.isFavorite,
          isPublic: updateModuleDto.isPublic,
          folders: updateModuleDto.folderId ? {
            connect: { id: updateModuleDto.folderId },
          } : undefined,
        },
        include: { flashcards: true },
      });
    });
    this.logger.log(`Module updated (id=${id})`);
    return updated;
  }

  async remove(userId: string, id: string) {
    const module = await this.prisma.module.findFirst({
      where: { id, userId },
    });
    if (!module) {
      this.logger.warn(`Module delete rejected: not found (id=${id}, userId=${userId})`);
      throw new NotFoundException('Module not found or not belongs to you');
    }

    await this.prisma.flashcard.deleteMany({ where: { moduleId: id } });

    const deleted = await this.prisma.module.delete({
      where: { id },
    });
    this.logger.log(`Module deleted (id=${id})`);
    return deleted;
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
        orderBy: [{ createdAt: 'desc' as const }, { id: 'asc' as const }],
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
    const [totalModules, cardsLearned, candidates] = await Promise.all([
      this.prisma.module.count({ where: { userId } }),
      this.prisma.flashcard.count({ where: { status: 'KNOWN', module: { userId } } }),
      this.prisma.module.findMany({
        where: { userId, flashcards: { some: { status: { not: 'UNSTUDIED' } } } },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        select: { id: true, name: true, updatedAt: true },
      }),
    ]);

    const progress = candidates.length
      ? await this.prisma.flashcard.groupBy({
          by: ['moduleId', 'status'],
          where: { moduleId: { in: candidates.map((m) => m.id) } },
          _count: { _all: true },
        })
      : [];

    const countsByModule = new Map<string, Record<string, number>>();
    for (const row of progress) {
      const entry = countsByModule.get(row.moduleId) ?? {};
      entry[row.status] = row._count._all;
      countsByModule.set(row.moduleId, entry);
    }

    const continueLearning = candidates
      .map((m) => {
        const counts = countsByModule.get(m.id) ?? {};
        const known = counts.KNOWN ?? 0;
        const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
        const unfinished = total > known;
        return { id: m.id, name: m.name, updatedAt: m.updatedAt, known, total, unfinished };
      })
      .filter((m) => m.unfinished)
      .slice(0, 5)
      .map(({ unfinished, ...rest }) => rest);

    return { totalModules, cardsLearned, continueLearning };
  }

  async saveToLibrary(userId: string, id: string) {
    const originalModule = await this.prisma.module.findFirst({
      where: { id, isPublic: true },
      include: { flashcards: true },
    });

    if (!originalModule) {
      this.logger.warn(`Save to library rejected: public module not found (id=${id}, userId=${userId})`);
      throw new NotFoundException('Public module not found');
    }

    if (originalModule.userId === userId) {
      this.logger.warn(`Save to library rejected: own module (id=${id}, userId=${userId})`);
      throw new BadRequestException('You cannot save your own module to your library');
    }

    const saved = await this.prisma.module.create({
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
    this.logger.log(`Module saved to library (originalId=${id}, newId=${saved.id}, userId=${userId})`);
    return saved;
  }

}



