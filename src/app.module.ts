import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FoldersModule } from './folders/folders.module';
import { ModulesModule } from './modules/modules.module';
import { FlashcardsModule } from './flashcards/flashcards.module';

@Module({
  imports: [PrismaModule, AuthModule, FoldersModule, ModulesModule, FlashcardsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
