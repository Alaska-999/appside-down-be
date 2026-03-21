import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto, SignupDto } from './dto/signup.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

    constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService) { }

    async generateToken(userId: string, email: string) {
        return this.jwtService.signAsync({ userId, email });
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
            return {
                email: user.email,
                username: user.username,
                id: user.id,
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

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid password');
        }

        const token = await this.generateToken(user.id, user.email);

        return {
            access_token: token,
        };
    }
}
