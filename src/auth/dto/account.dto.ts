export class ChangePasswordDto {
    oldPassword: string;
    newPassword: string;
}

export class DeleteAccountDto {
    password: string;
}


export class ResetPasswordDto {
    email: string;
    code: string;
    newPassword: string;
}