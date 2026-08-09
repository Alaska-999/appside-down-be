import { HttpException, HttpStatus, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

const LOGIN_MAX_FAILURES_PER_EMAIL_IP = 5;
const LOGIN_MAX_FAILURES_PER_IP = 20;
const LOGIN_WINDOW_SECONDS = 15 * 60;

const FORGOT_MAX_PER_EMAIL = 5;
const FORGOT_MAX_PER_IP = 10;
const FORGOT_WINDOW_SECONDS = 60 * 60;

@Injectable()
export class AuthRateLimitService implements OnModuleDestroy {
    private readonly logger = new Logger(AuthRateLimitService.name);
    private readonly redis = new Redis({
        host: process.env.REDIS_HOST ?? 'localhost',
        port: +(process.env.REDIS_PORT ?? 6379),
    });

    async assertLoginAllowed(email: string, ip: string) {
        await this.assertUnderLimit(this.loginEmailIpKey(email, ip), LOGIN_MAX_FAILURES_PER_EMAIL_IP, 'Too many failed login attempts');
        await this.assertUnderLimit(this.loginIpKey(ip), LOGIN_MAX_FAILURES_PER_IP, 'Too many failed login attempts');
    }

    async recordLoginFailure(email: string, ip: string) {
        await this.increment(this.loginEmailIpKey(email, ip), LOGIN_WINDOW_SECONDS);
        await this.increment(this.loginIpKey(ip), LOGIN_WINDOW_SECONDS);
    }

    async resetLoginFailures(email: string, ip: string) {
        await this.redis.del(this.loginEmailIpKey(email, ip));
    }

    async assertForgotPasswordAllowed(email: string, ip: string) {
        await this.assertUnderLimit(this.forgotEmailKey(email), FORGOT_MAX_PER_EMAIL, 'Too many password reset requests');
        await this.assertUnderLimit(this.forgotIpKey(ip), FORGOT_MAX_PER_IP, 'Too many password reset requests');
        await this.increment(this.forgotEmailKey(email), FORGOT_WINDOW_SECONDS);
        await this.increment(this.forgotIpKey(ip), FORGOT_WINDOW_SECONDS);
    }

    private async assertUnderLimit(key: string, limit: number, message: string) {
        const count = await this.redis.get(key);
        if (Number(count) >= limit) {
            const ttl = await this.redis.ttl(key);
            const minutes = Math.max(1, Math.ceil(ttl / 60));
            this.logger.warn(`Rate limit hit (key=${this.redactKey(key)}, count=${count}, limit=${limit})`);
            throw new HttpException(
                `${message}. Try again in ${minutes} min.`,
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }
    }

    private redactKey(key: string) {
        return key.replace(/[^:]+@[^:]+/, '<email>');
    }

    private async increment(key: string, windowSeconds: number) {
        const count = await this.redis.incr(key);
        if (count === 1) {
            await this.redis.expire(key, windowSeconds);
        }
    }

    private loginEmailIpKey(email: string, ip: string) {
        return `auth:login-failures:${ip}:${email.toLowerCase()}`;
    }

    private loginIpKey(ip: string) {
        return `auth:login-failures:ip:${ip}`;
    }

    private forgotEmailKey(email: string) {
        return `auth:forgot-password:email:${email.toLowerCase()}`;
    }

    private forgotIpKey(ip: string) {
        return `auth:forgot-password:ip:${ip}`;
    }

    async onModuleDestroy() {
        await this.redis.quit();
    }
}
