export class RegisterTokenDto {
    token: string;
    platform: 'ios' | 'android';
}

export class RemoveTokenDto {
    token: string;
}

export class UpdateSettingsDto {
    pushNotificationsEnabled: boolean;
}
