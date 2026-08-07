import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterTokenDto } from './dto/notifications.dto';

@Injectable()
export class NotificationsService {

    constructor(private readonly prisma: PrismaService,
    ) { }

    async registerToken(userId: string, dto: RegisterTokenDto) {
        // upsert: той самий девайс при повторній реєстрації оновлює запис, а не створює дубль;
        // update з userId покриває випадок, коли на девайсі перелогінились в інший акаунт
        return this.prisma.pushToken.upsert({
            where: { token: dto.token },
            create: { token: dto.token, platform: dto.platform, userId },
            update: { userId, platform: dto.platform },
        });
    }

    async removeToken(userId: string, token: string) {
        await this.prisma.pushToken.deleteMany({
            where: { token, userId },
        });
    }

    async updateSettings(userId: string, pushNotificationsEnabled: boolean) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { pushNotificationsEnabled },
            select: { pushNotificationsEnabled: true },
        });
    }
}
