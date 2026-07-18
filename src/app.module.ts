import { Module } from '@nestjs/common';
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


@Module({
  imports: [
    PrismaModule,
    AuthModule,
    FoldersModule,
    ModulesModule,
    FlashcardsModule,
    NotificationsModule,
    StudyModule,
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
