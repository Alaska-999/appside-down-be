import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import {
  ENDPOINT_THROTTLE_LIMIT,
  GLOBAL_THROTTLE_LIMIT,
  THROTTLE_WINDOW_MS,
} from './throttler.constants';
import { UserOrIpThrottlerGuard } from './user-or-ip-throttler.guard';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}),
    ThrottlerModule.forRoot({
      errorMessage: 'Too many requests. Please slow down and try again shortly.',
      throttlers: [
        {
          name: 'global',
          ttl: THROTTLE_WINDOW_MS,
          limit: GLOBAL_THROTTLE_LIMIT,
          generateKey: (_context, tracker, name) => `${name}:${tracker}`,
        },
        {
          name: 'default',
          ttl: THROTTLE_WINDOW_MS,
          limit: ENDPOINT_THROTTLE_LIMIT,
        },
      ],
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: UserOrIpThrottlerGuard }],
})
export class AppThrottlerModule { }
