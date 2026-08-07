import { HttpException, HttpStatus, Injectable, OnModuleDestroy } from '@nestjs/common';

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60_000;

@Injectable()
export class LoginAttemptsService implements OnModuleDestroy {
    private readonly failuresByEmail = new Map<string, number[]>();
    private readonly cleanupTimer = setInterval(() => this.removeExpired(), WINDOW_MS);

    assertNotBlocked(email: string) {
        const failures = this.recentFailures(email);
        if (failures.length >= MAX_FAILURES) {
            const retryAfterMs = failures[0] + WINDOW_MS - Date.now();
            const minutes = Math.ceil(retryAfterMs / 60_000);
            throw new HttpException(
                `Too many failed login attempts. Try again in ${minutes} min.`,
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }
    }

    recordFailure(email: string) {
        const failures = this.recentFailures(email);
        failures.push(Date.now());
        this.failuresByEmail.set(this.key(email), failures);
    }

    reset(email: string) {
        this.failuresByEmail.delete(this.key(email));
    }

    private recentFailures(email: string) {
        const cutoff = Date.now() - WINDOW_MS;
        const failures = this.failuresByEmail.get(this.key(email)) ?? [];
        return failures.filter((timestamp) => timestamp > cutoff);
    }

    private key(email: string) {
        return email.toLowerCase();
    }

    private removeExpired() {
        const cutoff = Date.now() - WINDOW_MS;
        for (const [email, failures] of this.failuresByEmail) {
            if (failures.every((timestamp) => timestamp <= cutoff)) {
                this.failuresByEmail.delete(email);
            }
        }
    }

    onModuleDestroy() {
        clearInterval(this.cleanupTimer);
    }
}
