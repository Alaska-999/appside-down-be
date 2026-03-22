import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto, SignupDto } from './dto/signup.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

    constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService) { }



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
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        console.log(isPasswordValid);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid password');
        }

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
}
