import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const avatarUploadOptions = {
    storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'avatars'),
        filename: (_req, file, callback) => {
            callback(null, `${randomUUID()}${extname(file.originalname)}`);
        },
    }),
    fileFilter: (_req: any, file: Express.Multer.File, callback: (error: Error | null, accept: boolean) => void) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            callback(new BadRequestException('Only JPEG, PNG or WEBP images are allowed'), false);
            return;
        }
        callback(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 },
};
