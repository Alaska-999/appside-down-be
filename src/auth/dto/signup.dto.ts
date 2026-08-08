import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class SignupDto {
    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(2)
    @MaxLength(30)
    username!: string;

    @IsString()
    @MinLength(8)
    @MaxLength(72)
    @Matches(/\d/, { message: 'password must contain at least one number' })
    password!: string;
}


export class LoginDto {
    @IsEmail()
    email!: string;

    @IsString()
    password!: string;
}
