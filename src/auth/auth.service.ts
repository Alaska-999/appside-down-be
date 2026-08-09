import { BadRequestException, ConflictException, ForbiddenException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto, SignupDto } from './dto/signup.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthRateLimitService } from './auth-rate-limit.service';
import { Resend } from 'resend';
import crypto from 'node:crypto';
import { ResetPasswordDto } from './dto/account.dto';

const resend = new Resend(process.env.RESEND_API_KEY_DEV);

const hashRt = (rt: string) => crypto.createHash('sha256').update(rt).digest('hex');
const normalizeEmail = (email: string) => email.trim().toLowerCase();

const logger = new Logger('AuthService');

@Injectable()
export class AuthService {

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
        private readonly authRateLimit: AuthRateLimitService,
    ) { }



    async generateTokens(userId: string, email: string) {
        const [at, rt] = await Promise.all([
            this.jwtService.signAsync({ userId, email, typ: 'access' }, { secret: this.config.getOrThrow('AT_SECRET'), expiresIn: '15m' }),
            this.jwtService.signAsync({ userId, email, typ: 'refresh' }, { secret: this.config.getOrThrow('RT_SECRET'), expiresIn: '7d' }),
        ]);
        return {
            access_token: at,
            refresh_token: rt,
        };
    }
    async updateRtHash(userId: string, rt: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { hashedRt: hashRt(rt) },
        });
    }


    async refreshTokens(refreshToken: string) {
        let payload: any;
        try {
            payload = await this.jwtService.verifyAsync(refreshToken, { secret: this.config.getOrThrow('RT_SECRET') });
        } catch (e: any) {
            logger.warn(`refresh rejected: verify failed (${e?.message})`);
            throw new UnauthorizedException('Invalid refresh token');
        }

        if (payload.typ !== 'refresh') {
            logger.warn(`refresh rejected: bad payload typ=${payload.typ} userId=${payload.userId}`);
            throw new UnauthorizedException('Invalid refresh token');
        }

        const userId = payload.userId as string;
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
        });

        if (!user || !user.hashedRt) {
            logger.warn(`refresh rejected: user not found or no hashedRt (userId=${userId})`);
            throw new UnauthorizedException('Invalid refresh token');
        }

        if (hashRt(refreshToken) !== user.hashedRt) {
            logger.warn(`refresh rejected: hash mismatch, killing family (userId=${userId})`);
            await this.prisma.user.update({ where: { id: userId }, data: { hashedRt: null } });
            throw new UnauthorizedException('Invalid refresh token');
        }

        logger.log(`refresh OK (userId=${userId})`);

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
                    email: normalizeEmail(dto.email),
                    username: dto.username,
                    password: passwordHash,
                },
            });
            const token = await this.generateTokens(user.id, user.email);

            await this.updateRtHash(user.id, token.refresh_token);
            logger.log(`signup OK (userId=${user.id})`);
            return {
                user: {
                    email: user.email,
                    username: user.username,
                    id: user.id,
                },
                access_token: token.access_token,
                refresh_token: token.refresh_token,
            };
        } catch (error: any) {
            if (error.code === 'P2002') {
                logger.warn(`signup rejected: email already exists`);
                throw new ConflictException('Email already exists')
            }
            logger.error(`signup failed: ${error?.message}`, error?.stack);
            throw new InternalServerErrorException('Failed to signup');
        }
    }


    async login(dto: LoginDto, ip: string) {
        const email = normalizeEmail(dto.email);
        await this.authRateLimit.assertLoginAllowed(email, ip);

        const user = await this.prisma.user.findUnique({
            where: {
                email,
            },
        });

        if (!user) {
            await this.authRateLimit.recordLoginFailure(email, ip);
            logger.warn(`login rejected: user not found (ip=${ip})`);
            throw new NotFoundException('User not found');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            await this.authRateLimit.recordLoginFailure(email, ip);
            logger.warn(`login rejected: invalid password (userId=${user.id})`);
            throw new UnauthorizedException('Invalid password');
        }

        await this.authRateLimit.resetLoginFailures(email, ip);

        const token = await this.generateTokens(user.id, user.email);
        await this.updateRtHash(user.id, token.refresh_token);

        logger.log(`login OK (userId=${user.id})`);
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
        logger.log(`logout OK (userId=${userId})`);
    }

    async hashAndUpdatePassword(userId: string, newPassword: string) {
        const newHash = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: newHash },
        });
    }



    async changePassword(userId: string, oldPassword: string, newPassword: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isOldPasswordValid) {
            logger.warn(`change password rejected: current password incorrect (userId=${userId})`);
            throw new ForbiddenException('Current password is incorrect');
        }

        await this.hashAndUpdatePassword(userId, newPassword);
        await this.prisma.user.update({
            where: { id: userId },
            data: { hashedRt: null },
        });
        logger.log(`password changed (userId=${userId})`);
    }

    async deleteAccount(userId: string, password: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            logger.warn(`account deletion rejected: incorrect password (userId=${userId})`);
            throw new ForbiddenException('Incorrect password');
        }

        await this.prisma.$transaction([
            this.prisma.module.updateMany({ where: { authorId: userId }, data: { authorUsername: user.username } }),
            this.prisma.user.delete({ where: { id: userId } }),
        ]);
        logger.log(`account deleted (userId=${userId})`);
    }


    async forgotPassword(rawEmail: string, ip: string) {
        const email = normalizeEmail(rawEmail);
        await this.authRateLimit.assertForgotPasswordAllowed(email, ip);

        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return;
        }

        const existing = await this.prisma.passwordReset.findUnique({ where: { userId: user.id } });
        if (existing && existing.createdAt.getTime() > Date.now() - 60 * 1000) {
            return;
        }

        const code = crypto.randomInt(100000, 999999).toString();
        const codeHash = await bcrypt.hash(code, 10);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await this.prisma.passwordReset.upsert({
            where: { userId: user.id },
            update: {
                codeHash: codeHash,
                expiresAt: expiresAt,
                attempts: 0,
                createdAt: new Date(),
            },
            create: {
                userId: user.id,
                codeHash: codeHash,
                expiresAt: expiresAt,
            },
        });

        try {
            await resend.emails.send({
                from: 'onboarding@resend.dev',
                to: email,
                subject: 'Password Reset Code',
                html: `<p>Your password reset code is <strong>${code}</strong></p>`
            });
            logger.log(`password reset email sent (userId=${user.id})`);
        } catch (error: any) {
            logger.error(`password reset email failed (userId=${user.id}): ${error?.message}`, error?.stack);
            throw new InternalServerErrorException('Failed to send reset email');
        }
    }


    async resetPassword(dto: ResetPasswordDto) {
        const user = await this.prisma.user.findUnique({ where: { email: normalizeEmail(dto.email) } });
        if (!user) {
            throw new ForbiddenException('Invalid or expired code');
        }

        const passwordReset = await this.prisma.passwordReset.findUnique({ where: { userId: user.id } });
        if (!passwordReset) {
            throw new ForbiddenException('Invalid or expired code');
        }

        if (passwordReset.expiresAt < new Date()) {
            logger.warn(`reset password rejected: code expired (userId=${user.id})`);
            throw new ForbiddenException('Invalid or expired code');
        }

        if (passwordReset.attempts >= 5) {
            await this.prisma.passwordReset.delete({ where: { userId: user.id } });
            logger.warn(`reset password rejected: too many attempts (userId=${user.id})`);
            throw new ForbiddenException('Too many attempts. Request a new code');
        }

        const isCodeValid = await bcrypt.compare(dto.code, passwordReset.codeHash);
        if (!isCodeValid) {
            await this.prisma.passwordReset.update({
                where: { userId: user.id },
                data: { attempts: { increment: 1 } },
            });
            logger.warn(`reset password rejected: invalid code (userId=${user.id}, attempts=${passwordReset.attempts + 1})`);
            throw new ForbiddenException('Invalid code');
        }

        await this.hashAndUpdatePassword(user.id, dto.newPassword);
        await this.prisma.passwordReset.delete({ where: { userId: user.id } });

        await this.prisma.user.update({
            where: { id: user.id },
            data: { hashedRt: null },
        });
        logger.log(`password reset OK (userId=${user.id})`);
    }
}
