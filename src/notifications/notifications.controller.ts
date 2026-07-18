import { Body, Controller, Delete, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RegisterTokenDto, RemoveTokenDto, UpdateSettingsDto } from './dto/notifications.dto';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {

    constructor(private readonly notificationsService: NotificationsService) { }

    @Post('token')
    registerToken(@Req() req: any, @Body() dto: RegisterTokenDto) {
        return this.notificationsService.registerToken(req.user.userId, dto);
    }

    @Delete('token')
    removeToken(@Req() req: any, @Body() dto: RemoveTokenDto) {
        return this.notificationsService.removeToken(req.user.userId, dto.token);
    }

    @Patch('settings')
    updateSettings(@Req() req: any, @Body() dto: UpdateSettingsDto) {
        return this.notificationsService.updateSettings(
            req.user.userId,
            dto.pushNotificationsEnabled,
        );
    }
}
