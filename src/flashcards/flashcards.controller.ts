import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FLASHCARDS_THROTTLE_LIMIT, THROTTLE_WINDOW_MS } from 'src/common/throttler/throttler.constants';
import { FlashcardsService } from './flashcards.service';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Throttle({ default: { limit: FLASHCARDS_THROTTLE_LIMIT, ttl: THROTTLE_WINDOW_MS } })
@UseGuards(JwtAuthGuard)
@Controller('flashcards')
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) { }

  @Post()
  create(@Body() createFlashcardDto: CreateFlashcardDto, @Req() req: any) {
    const userId = req.user.userId;
    return this.flashcardsService.create(userId, createFlashcardDto);
  }

  @Get('module/:moduleId')
  findAll(@Param('moduleId') moduleId: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.flashcardsService.findAll(userId, moduleId);
  }

  @Get(':id')
  findOne(@Param('id') flashcardId: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.flashcardsService.findOne(userId, flashcardId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFlashcardDto: UpdateFlashcardDto, @Req() req: any) {
    const userId = req.user.userId;
    return this.flashcardsService.update(userId, id, updateFlashcardDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.flashcardsService.remove(userId, id);
  }
}
