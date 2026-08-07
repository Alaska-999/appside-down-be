import { BadRequestException, ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto, SignupDto } from './dto/signup.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginAttemptsService } from './login-attempts.service';

@Injectable()
export class AuthService {

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly loginAttempts: LoginAttemptsService,
    ) { }



    async generateTokens(userId: string, email: string) {
        const [at, rt] = await Promise.all([
            this.jwtService.signAsync({ userId, email, }, { secret: process.env.AT_SECRET, expiresIn: '30s' }),
            this.jwtService.signAsync({ userId, email }, { secret: process.env.RT_SECRET, expiresIn: '7d' }),
        ]);
        return {
            access_token: at,
            refresh_token: rt,
        };
    }
    async updateRtHash(userId: string, rt: string) {
        const hashedRt = await bcrypt.hash(rt, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { hashedRt: hashedRt },
        });
    }


    async refreshTokens(userId: string, refreshToken: string) {

        const user = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
        });

        if (!user || !user.hashedRt) {
            throw new NotFoundException('User not found');
        }

        const isRtValid = await bcrypt.compare(refreshToken, user.hashedRt);

        if (!isRtValid) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        const tokens = await this.generateTokens(user.id, user.email);
        await this.updateRtHash(user.id, tokens.refresh_token);


        return {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
        };
    }


    async signup(dto: SignupDto) {
        try {
            const passwordHash = await bcrypt.hash(dto.password, 10);
            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    username: dto.username,
                    password: passwordHash,
                },
            });
            const token = await this.generateTokens(user.id, user.email);

            await this.updateRtHash(user.id, token.refresh_token);
            return {
                user: {
                    email: user.email,
                    username: user.username,
                    id: user.id,
                },
                access_token: token.access_token,
                refresh_token: token.refresh_token,
            };
        } catch (error) {
            console.error('Signup error:', error);
            if (error.code === 'P2002') {
                throw new ConflictException('Email already exists')
            }
            throw new InternalServerErrorException('Failed to signup');
        }
    }


    async login(dto: LoginDto) {
        this.loginAttempts.assertNotBlocked(dto.email);

        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            },
        });

        if (!user) {
            this.loginAttempts.recordFailure(dto.email);
            throw new NotFoundException('User not found');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            this.loginAttempts.recordFailure(dto.email);
            throw new UnauthorizedException('Invalid password');
        }

        this.loginAttempts.reset(dto.email);

        const token = await this.generateTokens(user.id, user.email);
        await this.updateRtHash(user.id, token.refresh_token);


        return {
            user: {
                email: user.email,
                username: user.username,
                id: user.id,
            },
            access_token: token.access_token,
            refresh_token: token.refresh_token,
        };
    }


    async logout(userId: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { hashedRt: null },
        });
    }

    async changePassword(userId: string, oldPassword: string, newPassword: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isOldPasswordValid) {
            throw new ForbiddenException('Current password is incorrect');
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: newHash },
        });
    }

    async deleteAccount(userId: string, password: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new ForbiddenException('Incorrect password');
        }

        await this.prisma.$transaction([
            this.prisma.flashcard.deleteMany({ where: { module: { userId } } }),
            this.prisma.module.deleteMany({ where: { userId } }),
            this.prisma.module.updateMany({ where: { authorId: userId }, data: { authorId: null, authorUsername: user.username } }),
            this.prisma.folder.deleteMany({ where: { userId } }),
            this.prisma.pushToken.deleteMany({ where: { userId } }),
            this.prisma.user.delete({ where: { id: userId } }),
            this.prisma.studyEvent.deleteMany({ where: { userId } })
        ]);
    }
}
