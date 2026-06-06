import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { FoldersService } from 'src/folders/folders.service';
import { PrismaService } from 'src/prisma/prisma.service';

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
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.module.findMany({
      where: { userId },
      include: {
        folders: {
          select: { id: true },
        },
        _count: {
          select: { flashcards: true },
        },
      },
    });
  }

  findOne(userId: string, id: string) {
    return this.prisma.module.findFirst({
      where: { id, userId },
      include: {
        user: {
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
}
