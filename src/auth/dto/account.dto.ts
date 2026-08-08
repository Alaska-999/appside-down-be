import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @IsString()
    oldPassword!: string;

    @IsString()
    @MinLength(8)
    @MaxLength(72)
    @Matches(/\d/, { message: 'newPassword must contain at least one number' })
    newPassword!: string;
}

export class DeleteAccountDto {
    @IsString()
    password!: string;
}

export class RefreshDto {
    @IsString()
    refreshToken!: string;
}


export class ResetPasswordDto {
    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(6)
    @MaxLength(6)
    code!: string;

    @IsString()
    @MinLength(8)
    @MaxLength(72)
    @Matches(/\d/, { message: 'newPassword must contain at least one number' })
    newPassword!: string;
}
