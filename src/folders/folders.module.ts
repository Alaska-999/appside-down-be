import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FoldersService } from './folders.service';
import { FoldersController } from './folders.controller';
import { ModulesModule } from 'src/modules/modules.module';

@Module({
  imports: [PrismaModule],
  controllers: [FoldersController],
  providers: [FoldersService],
  exports: [FoldersService],
})
export class FoldersModule { }
