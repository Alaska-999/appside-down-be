import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { StudyService } from './study.service';
import { SubmitStudyEventsDto } from './dto/study.dto';

@UseGuards(JwtAuthGuard)
@Controller('study')
export class StudyController {
  constructor(private readonly studyService: StudyService) { }

  @Post('events')
  @HttpCode(202)
  submitEvents(@Req() req: any, @Body() dto: SubmitStudyEventsDto) {
    return this.studyService.submitEvents(req.user.userId, dto)
  }
}
