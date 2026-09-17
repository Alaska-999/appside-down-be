import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, UnrecoverableError } from 'bullmq';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PrismaService } from 'src/prisma/prisma.service';
import { StudyEventInputDto } from './dto/study.dto';
import { NormalizedStudyEvent, normalizeEvent } from './event-normalize';
import { StrengthEvent, foldStrength, statusForLevel } from './strength';

const HISTORY_LIMIT = 200;
const TRANSACTION_TIMEOUT_MS = 30_000;

@Processor('study')
export class StudyProcessor extends WorkerHost {
  private readonly logger = new Logger(StudyProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ userId: string; events: unknown[] }>) {
    const { userId, events: rawEvents } = job.data;

    const dtos = plainToInstance(StudyEventInputDto, rawEvents);
    for (const dto of dtos) {
      const errors = await validate(dto);
      if (errors.length) {
        const details = errors
          .map((e) => Object.values(e.constraints ?? {}).join(', '))
          .join('; ');
        this.logger.warn(`invalid study event payload for user ${userId}: ${details}`);
        throw new UnrecoverableError(
          `invalid study event payload for user ${userId}: ${details}`,
        );
      }
    }

    const events = dtos.map((dto) => this.normalize(dto, userId));

    const flashcardIds = [...new Set(events.map((e) => e.flashcardId))];
    const ownedFlashcards = await this.prisma.flashcard.findMany({
      where: { id: { in: flashcardIds }, module: { userId } },
      select: { id: true, moduleId: true },
    });
    const ownedModuleByFlashcard = new Map(
      ownedFlashcards.map((f) => [f.id, f.moduleId]),
    );

    const owned = events.filter(
      (e) => ownedModuleByFlashcard.get(e.flashcardId) === e.moduleId,
    );
    if (owned.length < events.length) {
      this.logger.warn(
        `dropped ${events.length - owned.length} study event(s) with unowned/mismatched flashcardId-moduleId for user ${userId}`,
      );
    }
    if (!owned.length) return;

    const touchedFlashcardIds = [...new Set(owned.map((e) => e.flashcardId))].sort();
    const moduleIds = [...new Set(owned.map((e) => e.moduleId))];

    await this.prisma.$transaction(
      async (tx) => {
        await tx.studyEvent.createMany({
          data: owned.map((e) => ({
            clientEventId: e.id,
            userId,
            flashcardId: e.flashcardId,
            moduleId: e.moduleId,
            status: null,
            mode: e.mode,
            correct: e.correct,
            firstTry: e.firstTry,
            responseMs: e.responseMs,
            answeredAt: e.answeredAt,
          })),
          skipDuplicates: true,
        });

        const cards = await tx.flashcard.findMany({
          where: { id: { in: touchedFlashcardIds } },
          select: { id: true, strengthLevel: true, baselineLevel: true },
        });
        const cardById = new Map(cards.map((c) => [c.id, c]));

        const history = await tx.studyEvent.findMany({
          where: { userId, flashcardId: { in: touchedFlashcardIds } },
          select: {
            flashcardId: true,
            mode: true,
            correct: true,
            answeredAt: true,
          },
          orderBy: { answeredAt: 'desc' },
          take: HISTORY_LIMIT * touchedFlashcardIds.length,
        });

        const historyByFlashcard = new Map<string, StrengthEvent[]>();
        for (const row of history) {
          if (row.mode === null || row.correct === null) continue;
          const bucket = historyByFlashcard.get(row.flashcardId) ?? [];
          if (bucket.length >= HISTORY_LIMIT) continue;
          bucket.push({
            mode: row.mode,
            correct: row.correct,
            answeredAt: row.answeredAt,
          });
          historyByFlashcard.set(row.flashcardId, bucket);
        }

        for (const flashcardId of touchedFlashcardIds) {
          const card = cardById.get(flashcardId);
          if (!card) continue;
          const strengthEvents = historyByFlashcard.get(flashcardId) ?? [];

          const computed = foldStrength(strengthEvents, card.baselineLevel);
          const level = Math.max(card.strengthLevel, computed);
          const sorted = [...strengthEvents].sort(
            (a, b) => a.answeredAt.getTime() - b.answeredAt.getTime(),
          );
          const lastCorrectAt =
            sorted.filter((e) => e.correct).at(-1)?.answeredAt ?? null;
          const lastWrongAt =
            sorted.filter((e) => !e.correct).at(-1)?.answeredAt ?? null;

          await tx.flashcard.update({
            where: { id: flashcardId },
            data: {
              strengthLevel: level,
              status: statusForLevel(level),
              lastCorrectAt,
              lastWrongAt,
            },
          });
        }

        await tx.module.updateMany({
          where: { id: { in: moduleIds }, userId },
          data: { updatedAt: new Date() },
        });
      },
      { timeout: TRANSACTION_TIMEOUT_MS },
    );

    this.logger.log(`Processed ${owned.length} study event(s) for user ${userId}`);
  }

  private normalize(dto: StudyEventInputDto, userId: string): NormalizedStudyEvent {
    try {
      return normalizeEvent(dto);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`invalid study event payload for user ${userId}: ${message}`);
      throw new UnrecoverableError(
        `invalid study event payload for user ${userId}: ${message}`,
      );
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Study job failed (jobId=${job.id}): ${error.message}`, error.stack);
  }
}
