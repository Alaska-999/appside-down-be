import {
    Controller,
    Delete,
    Patch,
    Req,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { avatarUploadOptions } from './avatar-upload.config';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Patch('me/avatar')
    @UseInterceptors(FileInterceptor('avatar', avatarUploadOptions))
    uploadAvatar(
        @UploadedFile() file: Express.Multer.File | undefined,
        @Req() req: any,
    ) {
        const host = `${req.protocol}://${req.get('host')}`;
        return this.usersService.updateAvatar(req.user.userId, file, host);
    }

    @Delete('me/avatar')
    removeAvatar(@Req() req: any) {
        return this.usersService.removeAvatar(req.user.userId);
    }
}
