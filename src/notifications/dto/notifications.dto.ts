import { IsBoolean, IsIn, IsString, MaxLength } from 'class-validator';

export class RegisterTokenDto {
    @IsString()
    @MaxLength(300)
    token!: string;

    @IsIn(['ios', 'android'])
    platform!: 'ios' | 'android';
}

export class RemoveTokenDto {
    @IsString()
    @MaxLength(300)
    token!: string;
}

export class UpdateSettingsDto {
    @IsBoolean()
    pushNotificationsEnabled!: boolean;
}
