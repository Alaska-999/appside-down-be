import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FoldersService {

  constructor(private readonly prisma: PrismaService) { }


  create(userId: string, createFolderDto: CreateFolderDto) {
    return this.prisma.folder.create({
      data: {
        ...createFolderDto,
        userId,
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.folder.findMany({
      where: { userId },
    });
  }

  findOne(userId: string, id: string) {
    return this.prisma.folder.findFirst({
      where: { id, userId },
    });
  }

  async update(userId: string, id: string, updateFolderDto: UpdateFolderDto) {
    const folder = await this.findOne(userId, id);
    if (!folder) throw new NotFoundException('Folder not found or not belongs to you');

    return this.prisma.folder.update({
      where: { id },
      data: updateFolderDto,
    });
  }

  async remove(userId: string, id: string) {
    const folder = await this.findOne(userId, id);
    if (!folder) throw new NotFoundException('Folder not found or not belongs to you');

    return this.prisma.folder.delete({
      where: { id },
    });
  }
}
