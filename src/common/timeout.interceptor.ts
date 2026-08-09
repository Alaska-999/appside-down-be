import {
    CallHandler,
    ExecutionContext,
    Injectable,
    Logger,
    NestInterceptor,
    RequestTimeoutException,
} from '@nestjs/common';
import { Observable, TimeoutError, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

const REQUEST_TIMEOUT_MS = 30_000;

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
    private readonly logger = new Logger(TimeoutInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            timeout(REQUEST_TIMEOUT_MS),
            catchError((error) => {
                if (error instanceof TimeoutError) {
                    const req = context.switchToHttp().getRequest();
                    this.logger.error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms: ${req.method} ${req.originalUrl}`);
                    return throwError(() => new RequestTimeoutException('Request took too long and was cancelled'));
                }
                return throwError(() => error);
            }),
        );
    }
}
