import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { memoryStorage } from 'multer';
import { join } from 'path';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const AVATARS_DIR = join(process.cwd(), 'uploads', 'avatars');

export const avatarUploadOptions = {
    storage: memoryStorage(),
    fileFilter: (_req: any, file: Express.Multer.File, callback: (error: Error | null, accept: boolean) => void) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            callback(new BadRequestException('Only JPEG, PNG or WEBP images are allowed'), false);
            return;
        }
        callback(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
};

export function detectImageExtension(buffer: Buffer | undefined): string | null {
    if (!buffer || buffer.length < 12) {
        return null;
    }

    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    if (isJpeg) {
        return '.jpg';
    }

    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (buffer.subarray(0, 8).equals(pngSignature)) {
        return '.png';
    }

    const isWebp =
        buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
    if (isWebp) {
        return '.webp';
    }

    return null;
}

export async function saveAvatarFile(file: Express.Multer.File): Promise<string> {
    const extension = detectImageExtension(file.buffer);
    if (!extension) {
        throw new BadRequestException('Only JPEG, PNG or WEBP images are allowed');
    }

    const filename = `${randomUUID()}${extension}`;
    await mkdir(AVATARS_DIR, { recursive: true });
    await writeFile(join(AVATARS_DIR, filename), file.buffer);
    return filename;
}
