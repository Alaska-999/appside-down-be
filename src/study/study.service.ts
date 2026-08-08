import { createHash } from 'node:crypto';
import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { SubmitStudyEventsDto } from './dto/study.dto';

@Injectable()
export class StudyService {
    constructor(@InjectQueue('study') private readonly queue: Queue) { }

    async submitEvents(userId: string, dto: SubmitStudyEventsDto) {
        if (!dto.events?.length) {
            throw new BadRequestException('events must not be empty');
        }
        if (dto.events.length > 100) {
            throw new BadRequestException('too many events, max 100');
        }

        const batchHash = createHash('sha256')
            .update(dto.events.map((e) => e.id).sort().join(','))
            .digest('hex')
            .slice(0, 32);

        await this.queue.add(
            'process-events',
            { userId, events: dto.events },
            { jobId: `study:${userId}:${batchHash}` },
        );
        return { queued: true, count: dto.events.length };
    }
}
