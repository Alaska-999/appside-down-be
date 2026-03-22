import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { LoginDto, SignupDto } from './dto/signup.dto';
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

    @UseGuards(JwtAuthGuard) // Додали охоронця
    @Get('test-protected')
    test() {
        console.log('test');
        return { message: 'Ти всередині! Токен спрацював.' };
    }
}
