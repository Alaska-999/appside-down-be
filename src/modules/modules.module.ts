import { Module } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { ModulesController } from './modules.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FoldersModule } from 'src/folders/folders.module';

@Module({
  imports: [PrismaModule, FoldersModule],
  controllers: [ModulesController],
  providers: [ModulesService],
})
export class ModulesModule { }
