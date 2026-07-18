export class ChangePasswordDto {
    oldPassword: string;
    newPassword: string;
}

export class DeleteAccountDto {
    password: string;
}
