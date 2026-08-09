import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterTokenDto } from './dto/notifications.dto';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(private readonly prisma: PrismaService,
    ) { }

    async registerToken(userId: string, dto: RegisterTokenDto) {
        // upsert: той самий девайс при повторній реєстрації оновлює запис, а не створює дубль;
        // update з userId покриває випадок, коли на девайсі перелогінились в інший акаунт
        const token = await this.prisma.pushToken.upsert({
            where: { token: dto.token },
            create: { token: dto.token, platform: dto.platform, userId },
            update: { userId, platform: dto.platform },
        });
        this.logger.log(`Push token registered (userId=${userId}, platform=${dto.platform})`);
        return token;
    }

    async removeToken(userId: string, token: string) {
        await this.prisma.pushToken.deleteMany({
            where: { token, userId },
        });
        this.logger.log(`Push token removed (userId=${userId})`);
    }

    async updateSettings(userId: string, pushNotificationsEnabled: boolean) {
        const result = await this.prisma.user.update({
            where: { id: userId },
            data: { pushNotificationsEnabled },
            select: { pushNotificationsEnabled: true },
        });
        this.logger.log(`Notification settings updated (userId=${userId}, enabled=${pushNotificationsEnabled})`);
        return result;
    }
}
