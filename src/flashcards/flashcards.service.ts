import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FlashcardsService {
  private readonly logger = new Logger(FlashcardsService.name);

  constructor(private readonly prisma: PrismaService) { }

  async create(userId: string, createFlashcardDto: CreateFlashcardDto) {
    const module = await this.prisma.module.findFirst({
      where: { id: createFlashcardDto.moduleId, userId },
    });

    if (!module) {
      this.logger.warn(`Flashcard create rejected: module not found (moduleId=${createFlashcardDto.moduleId}, userId=${userId})`);
      throw new NotFoundException('Module not found or access denied');
    }

    const flashcard = await this.prisma.flashcard.create({
      data: {
        ...createFlashcardDto,
        moduleId: module.id,
      },
    });
    this.logger.log(`Flashcard created (id=${flashcard.id}, moduleId=${module.id})`);
    return flashcard;
  }

  findAll(userId: string, moduleId: string) {
    return this.prisma.flashcard.findMany({
      where: { module: { id: moduleId, OR: [{ userId }, { isPublic: true }] } },
    });
  }

  findOne(userId: string, flashcardId: string) {
    return this.prisma.flashcard.findFirst({
      where: { id: flashcardId, module: { userId } },
    });
  }


  async update(userId: string, id: string, updateFlashcardDto: UpdateFlashcardDto) {

    const flashcard = await this.findOne(userId, id);
    if (!flashcard) {
      this.logger.warn(`Flashcard update rejected: not found (id=${id}, userId=${userId})`);
      throw new NotFoundException('Flashcard not found or not belongs to you');
    }

    const updated = await this.prisma.flashcard.update({
      where: { id },
      data: updateFlashcardDto,
    });
    this.logger.log(`Flashcard updated (id=${id})`);
    return updated;
  }

  async remove(userId: string, id: string,) {
    const flashcard = await this.findOne(userId, id);
    if (!flashcard) {
      this.logger.warn(`Flashcard delete rejected: not found (id=${id}, userId=${userId})`);
      throw new NotFoundException('Flashcard not found or not belongs to you');
    }

    const deleted = await this.prisma.flashcard.delete({
      where: { id },
    });
    this.logger.log(`Flashcard deleted (id=${id})`);
    return deleted;
  }
}

