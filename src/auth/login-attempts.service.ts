import { HttpException, HttpStatus, Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

const MAX_FAILURES = 5;
const WINDOW_SECONDS = 15 * 60;

@Injectable()
export class LoginAttemptsService implements OnModuleDestroy {
    private readonly redis = new Redis({
        host: process.env.REDIS_HOST ?? 'localhost',
        port: +(process.env.REDIS_PORT ?? 6379),
    });

    async assertNotBlocked(email: string) {
        const key = this.key(email);
        const count = await this.redis.get(key);

        if (Number(count) >= MAX_FAILURES) {
            const ttl = await this.redis.ttl(key);
            const minutes = Math.max(1, Math.ceil(ttl / 60));
            throw new HttpException(
                `Too many failed login attempts. Try again in ${minutes} min.`,
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }
    }

    async recordFailure(email: string) {
        const key = this.key(email);
        const count = await this.redis.incr(key);
        if (count === 1) {
            await this.redis.expire(key, WINDOW_SECONDS);
        }
    }

    async reset(email: string) {
        await this.redis.del(this.key(email));
    }

    private key(email: string) {
        return `login-attempts:email:${email.toLowerCase()}`;
    }

    async onModuleDestroy() {
        await this.redis.quit();
    }
}
