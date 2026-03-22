import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor() {
        super({
            // 1. Де шукати токен? В заголовку Authorization: Bearer <token>
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            // 2. Чи ігнорувати прострочені токени? Ні!
            ignoreExpiration: false,
            // 3. Секретний ключ для перевірки (той самий, що в .env)
            secretOrKey: process.env.AT_SECRET || '',
        });
    }

    // Цей метод викликається автоматично, якщо токен валідний
    async validate(payload: any) {
        // payload — це те, що ми зашили в токен (userId, email)
        // Те, що ми повернемо тут, запишеться в req.user
        return { userId: payload.userId, email: payload.email };
    }
}