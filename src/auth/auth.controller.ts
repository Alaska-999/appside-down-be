import { Body, Controller, Delete, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { LoginDto, SignupDto } from './dto/signup.dto';
import { ChangePasswordDto, DeleteAccountDto, ResetPasswordDto } from './dto/account.dto';
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

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    logout(@Req() req: any) {
        return this.authService.logout(req.user.userId);
    }

    @Post('refresh')
    refresh(@Body('userId') userId: string, @Body('refreshToken') refreshToken: string) {
        return this.authService.refreshTokens(userId, refreshToken);
    }

    @Post('forgot-password')
    forgotPassword(@Body('email') email: string) {
        return this.authService.forgotPassword(email);
    }

    @Post('reset-password')
    resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('password')
    async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
        await this.authService.changePassword(req.user.userId, dto.oldPassword, dto.newPassword);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('account')
    async deleteAccount(@Req() req: any, @Body() dto: DeleteAccountDto) {
        await this.authService.deleteAccount(req.user.userId, dto.password);
    }

    @UseGuards(JwtAuthGuard) // Додали охоронця
    @Get('test-protected')
    test() {
        console.log('test');
        return { message: 'Ти всередині! Токен спрацював.' };
    }
}
