import { BadRequestException } from '@nestjs/common';
import { StudyMode } from 'src/generated/prisma/client';
import { StudyEventInputDto } from './dto/study.dto';

export type NormalizedStudyEvent = {
  id: string;
  flashcardId: string;
  moduleId: string;
  mode: StudyMode;
  correct: boolean;
  firstTry: boolean | null;
  responseMs: number | null;
  answeredAt: Date;
};

export function normalizeEvent(raw: StudyEventInputDto): NormalizedStudyEvent {
  const shared = {
    id: raw.id,
    flashcardId: raw.flashcardId,
    moduleId: raw.moduleId,
    answeredAt: new Date(raw.answeredAt),
  };

  if (raw.mode && typeof raw.correct === 'boolean') {
    return {
      ...shared,
      mode: raw.mode,
      correct: raw.correct,
      firstTry: raw.firstTry ?? null,
      responseMs: raw.responseMs ?? null,
    };
  }

  if (raw.status) {
    return {
      ...shared,
      mode: 'FLASHCARDS',
      correct: raw.status === 'KNOWN',
      firstTry: null,
      responseMs: null,
    };
  }

  throw new BadRequestException('study event must carry either status or mode+correct');
}
