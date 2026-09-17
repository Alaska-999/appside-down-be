import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
} from '@nestjs/throttler';
import type {
  ThrottlerLimitDetail,
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';

@Injectable()
export class UserOrIpThrottlerGuard extends ThrottlerGuard {
  private readonly accessSecret: string;
  private readonly throttleLogger = new Logger(UserOrIpThrottlerGuard.name);

  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly jwtService: JwtService,
    config: ConfigService,
  ) {
    super(options, storageService, reflector);
    this.accessSecret = config.getOrThrow<string>('AT_SECRET');
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const req = context.switchToHttp().getRequest();
    this.throttleLogger.warn(
      `Throttled ${req.method} ${req.originalUrl} (tracker=${throttlerLimitDetail.tracker}, hits=${throttlerLimitDetail.totalHits}, limit=${throttlerLimitDetail.limit})`,
    );
    return super.throwThrottlingException(context, throttlerLimitDetail);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const userId = this.resolveUserId(req);
    if (userId) {
      return `user:${userId}`;
    }
    return `ip:${req.ip ?? 'unknown'}`;
  }

  private resolveUserId(req: Record<string, any>): string | null {
    const header = req.headers?.authorization;
    if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
      return null;
    }
    try {
      const payload = this.jwtService.verify<{ typ?: string; userId?: string }>(
        header.slice('Bearer '.length),
        { secret: this.accessSecret, ignoreExpiration: true },
      );
      if (payload?.typ !== 'access' || !payload.userId) {
        return null;
      }
      return String(payload.userId);
    } catch {
      return null;
    }
  }
}
