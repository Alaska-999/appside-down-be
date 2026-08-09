import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, UnrecoverableError } from 'bullmq';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PrismaService } from 'src/prisma/prisma.service';
import { StudyEventInputDto } from './dto/study.dto';

@Processor('study')
export class StudyProcessor extends WorkerHost {
  private readonly logger = new Logger(StudyProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ userId: string; events: unknown[] }>) {
    const { userId, events: rawEvents } = job.data;

    const events = plainToInstance(StudyEventInputDto, rawEvents);
    for (const event of events) {
      const errors = await validate(event);
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

    const latest = Array.from(
      new Map(owned.map((e) => [e.flashcardId, e])).values(),
    );

    const knownIds = latest
      .filter((e) => e.status === 'KNOWN')
      .map((e) => e.flashcardId);
    const stillLearningIds = latest
      .filter((e) => e.status === 'STILL_LEARNING')
      .map((e) => e.flashcardId);
    const moduleIds = [...new Set(latest.map((e) => e.moduleId))];

    await this.prisma.$transaction([
      this.prisma.studyEvent.createMany({
        data: owned.map((e) => ({
          clientEventId: e.id,
          userId,
          flashcardId: e.flashcardId,
          moduleId: e.moduleId,
          status: e.status,
          answeredAt: new Date(e.answeredAt),
        })),
        skipDuplicates: true,
      }),
      this.prisma.flashcard.updateMany({
        where: { id: { in: knownIds }, module: { userId } },
        data: { status: 'KNOWN' },
      }),
      this.prisma.flashcard.updateMany({
        where: { id: { in: stillLearningIds }, module: { userId } },
        data: { status: 'STILL_LEARNING' },
      }),
      this.prisma.module.updateMany({
        where: { id: { in: moduleIds }, userId },
        data: { updatedAt: new Date() },
      }),
    ]);
    this.logger.log(`Processed ${owned.length} study event(s) for user ${userId}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Study job failed (jobId=${job.id}): ${error.message}`, error.stack);
  }
}
