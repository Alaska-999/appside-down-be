import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor() {
        const adapter = new PrismaPg({
            connectionString: process.env.DATABASE_URL as string,
            connectionTimeoutMillis: 2_000,
            query_timeout: 2_000,
            statement_timeout: 2_000,
        });
        super({ adapter });
    }

    async onModuleInit() {
        await this.$connect();
    }
}