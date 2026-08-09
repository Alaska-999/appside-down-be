import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        const statementTimeoutMs = +(process.env.DB_STATEMENT_TIMEOUT_MS ?? 2_000);
        const adapter = new PrismaPg({
            connectionString: process.env.DATABASE_URL as string,
            connectionTimeoutMillis: 2_000,
            query_timeout: statementTimeoutMs,
            statement_timeout: statementTimeoutMs,
        });
        super({ adapter });
    }

    async onModuleInit() {
        await this.$connect();
        this.logger.debug('Database connected');
    }
}