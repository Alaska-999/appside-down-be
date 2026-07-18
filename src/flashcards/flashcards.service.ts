import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FlashcardsService {


  constructor(private readonly prisma: PrismaService) { }

  async create(userId: string, createFlashcardDto: CreateFlashcardDto) {
    const module = await this.prisma.module.findFirst({
      where: { id: createFlashcardDto.moduleId, userId },
    });

    if (!module) {
      throw new NotFoundException('Module not found or access denied');
    }

    return this.prisma.flashcard.create({
      data: {
        ...createFlashcardDto,
        moduleId: module.id,
      },
    });


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
    if (!flashcard) throw new NotFoundException('Flashcard not found or not belongs to you');

    return this.prisma.flashcard.update({
      where: { id },
      data: updateFlashcardDto,
    });
  }

  async remove(userId: string, id: string,) {
    const flashcard = await this.findOne(userId, id);
    if (!flashcard) throw new NotFoundException('Flashcard not found or not belongs to you');

    return this.prisma.flashcard.delete({
      where: { id },
    });
  }
}

