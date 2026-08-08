import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FoldersModule } from './folders/folders.module';
import { ModulesModule } from './modules/modules.module';
import { FlashcardsModule } from './flashcards/flashcards.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BullModule } from '@nestjs/bullmq';
import { StudyModule } from './study/study.module';
import { UsersModule } from './users/users.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        AT_SECRET: Joi.string().min(32).required(),
        RT_SECRET: Joi.string().min(32).required(),
        RESEND_API_KEY_DEV: Joi.string().required(),
      }).custom((value, helpers) => {
        if (value.AT_SECRET === value.RT_SECRET) {
          return helpers.error('any.invalid');
        }
        return value;
      }, 'AT_SECRET/RT_SECRET must differ').messages({
        'any.invalid': 'AT_SECRET and RT_SECRET must not be the same value',
      }),
    }),
    PrismaModule,
    AuthModule,
    FoldersModule,
    ModulesModule,
    FlashcardsModule,
    NotificationsModule,
    StudyModule,
    UsersModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: +(process.env.REDIS_PORT ?? 6379),
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule { }
