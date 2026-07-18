import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from 'src/prisma/prisma.service';
import { StudyEventInputDto } from './dto/study.dto';

@Processor('study')
export class StudyProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }
  /**
     * Processes background jobs for user study events in a single database transaction:
     * 1. Logs all incoming study events to the history.
     * 2. Deduplicates events to find the latest status per flashcard.
     * 3. Updates the current status (`KNOWN` / `STILL_LEARNING`) of the modified flashcards.
     * 4. Refreshes the `updatedAt` timestamp for all affected study modules.
     */
  async process(job: Job<{ userId: string; events: StudyEventInputDto[] }>) {
    const { userId, events } = job.data;

    const latest = Array.from(new Map(events.map(e => [e.flashcardId, e])).values());

    const knownIds = latest
      .filter((e) => e.status === 'KNOWN')
      .map((e) => e.flashcardId);
    const stillLearningIds = latest
      .filter((e) => e.status === 'STILL_LEARNING')
      .map((e) => e.flashcardId);
    const moduleIds = [...new Set(latest.map((e) => e.moduleId))];

    await this.prisma.$transaction([
      this.prisma.studyEvent.createMany({
        data: events.map((e) => ({
          userId,
          flashcardId: e.flashcardId,
          moduleId: e.moduleId,
          status: e.status,
          answeredAt: new Date(e.answeredAt),
        })),
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
  }
}
