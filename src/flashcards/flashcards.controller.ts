import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { FlashcardsService } from './flashcards.service';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('flashcards')
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) { }

  @Post()
  create(@Body() createFlashcardDto: CreateFlashcardDto, @Req() req: any) {
    const userId = req.user.id;
    return this.flashcardsService.create(userId, createFlashcardDto);
  }

  @Get('module/:moduleId')
  findAll(@Param('moduleId') moduleId: string, @Req() req: any) {
    const userId = req.user.id;
    return this.flashcardsService.findAll(userId, moduleId);
  }

  @Get(':id')
  findOne(@Param('id') flashcardId: string, @Req() req: any) {
    const userId = req.user.id;
    return this.flashcardsService.findOne(userId, flashcardId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFlashcardDto: UpdateFlashcardDto, @Req() req: any) {
    const userId = req.user.id;
    return this.flashcardsService.update(userId, id, updateFlashcardDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    return this.flashcardsService.remove(userId, id);
  }
}
