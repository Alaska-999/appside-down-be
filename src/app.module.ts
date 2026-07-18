import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FoldersModule } from './folders/folders.module';
import { ModulesModule } from './modules/modules.module';
import { FlashcardsModule } from './flashcards/flashcards.module';
import { NotificationsModule } from './notifications/notifications.module';
import { NotificationsController } from './notifications/notifications.controller';
import { NotificationsService } from './notifications/notifications.service';

@Module({
  imports: [PrismaModule, AuthModule, FoldersModule, ModulesModule, FlashcardsModule, NotificationsModule],
  controllers: [AppController, NotificationsController],
  providers: [AppService, NotificationsService],
})
export class AppModule {}
