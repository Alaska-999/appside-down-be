import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async updateAvatar(userId: string, file: Express.Multer.File | undefined, host: string) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        this.deleteLocalAvatarFile(user?.avatarUrl);

        const avatarUrl = `${host}/uploads/avatars/${file.filename}`;
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { avatarUrl },
            select: { avatarUrl: true },
        });

        return updated;
    }

    async removeAvatar(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        this.deleteLocalAvatarFile(user?.avatarUrl);

        return this.prisma.user.update({
            where: { id: userId },
            data: { avatarUrl: null },
            select: { avatarUrl: true },
        });
    }

    // видаляє файл з диска, тільки якщо avatarUrl вказує на наш /uploads/avatars/*
    // (щоб не намагатись стирати зовнішні URL)
    private deleteLocalAvatarFile(avatarUrl: string | null | undefined) {
        if (!avatarUrl) return;

        const marker = '/uploads/avatars/';
        const index = avatarUrl.indexOf(marker);
        if (index === -1) return;

        const filename = avatarUrl.slice(index + marker.length);
        const filePath = join(process.cwd(), 'uploads', 'avatars', filename);

        try {
            if (existsSync(filePath)) {
                unlinkSync(filePath);
            }
        } catch (err) {
            console.error('[UsersService] failed to delete old avatar file:', err);
        }
    }
}
