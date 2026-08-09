import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import 'dotenv/config';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { createAppLogger, statusColor } from './common/logger';
import { TimeoutInterceptor } from './common/timeout.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: createAppLogger('brnrv-api'),
  });
  app.set('etag', false);
  app.set('trust proxy', 1);
  const logger = new Logger('HTTP');
  app.use((req: any, res: any, next: any) => {
    const startedAt = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - startedAt;
      logger.log(`${req.method} ${req.originalUrl} ${statusColor(res.statusCode)} ${duration}ms`);
    });
    next();
  });
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalInterceptors(new TimeoutInterceptor());

  const avatarsDir = join(process.cwd(), 'uploads', 'avatars');
  if (!existsSync(avatarsDir)) {
    mkdirSync(avatarsDir, { recursive: true });
  }
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  await app.listen(process.env.PORT ?? 5111);
}
bootstrap();
