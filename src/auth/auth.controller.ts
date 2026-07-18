import { Body, Controller, Delete, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { LoginDto, SignupDto } from './dto/signup.dto';
import { ChangePasswordDto, DeleteAccountDto } from './dto/account.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) { }


    @Post('signup')
    signup(@Body() dto: SignupDto) {
        return this.authService.signup(dto);
    }

    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Post('logout')
    logout(@Body('userId') userId: string) {
        return this.authService.logout(userId);
    }

    @Post('refresh')
    refresh(@Body('userId') userId: string, @Body('refreshToken') refreshToken: string) {
        return this.authService.refreshTokens(userId, refreshToken);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('password')
    async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
        await this.authService.changePassword(req.user.userId, dto.oldPassword, dto.newPassword);
        return { success: true };
    }

    @UseGuards(JwtAuthGuard)
    @Delete('account')
    async deleteAccount(@Req() req: any, @Body() dto: DeleteAccountDto) {
        await this.authService.deleteAccount(req.user.userId, dto.password);
        return { success: true };
    }

    @UseGuards(JwtAuthGuard) // Додали охоронця
    @Get('test-protected')
    test() {
        console.log('test');
        return { message: 'Ти всередині! Токен спрацював.' };
    }
}
