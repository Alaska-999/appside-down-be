import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

const logger = new Logger('JwtAuthGuard');

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        if (err || !user) {
            const req = context.switchToHttp().getRequest();
            logger.warn(`${req.method} ${req.originalUrl} rejected: ${info?.message || err?.message || 'no user'}`);
        }
        return super.handleRequest(err, user, info, context);
    }
}
