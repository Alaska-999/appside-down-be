import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

const logger = new Logger('JwtStrategy');

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(config: ConfigService) {
        super({
            // 1. Де шукати токен? В заголовку Authorization: Bearer <token>
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            // 2. Чи ігнорувати прострочені токени? Ні
            ignoreExpiration: false,
            // 3. Секретний ключ для перевірки (той, що в .env)
            secretOrKey: config.getOrThrow<string>('AT_SECRET'),
        });
    }

    // Цей метод викликається, якщо токен валідний
    async validate(payload: any) {
        if (payload.typ !== 'access') {
            logger.warn(`rejected: typ=${payload.typ} userId=${payload.userId}`);
            throw new UnauthorizedException();
        }
        // payload — це те, що ми зашили в токен (userId, email)
        // Те, що ми повернемо тут, запишеться в req.user
        return { userId: payload.userId, email: payload.email };
    }
}
