import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import 'dotenv/config';
import { createAppLogger } from './common/logger';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: createAppLogger('brnrv-worker'),
  });
  app.enableShutdownHooks();
  new Logger('Worker').log('study worker started');
}
bootstrap();
