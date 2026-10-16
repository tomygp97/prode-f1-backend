import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { normalizeEmail } from '../../../application/auth/normalize-email';

const toNormalizedEmail = ({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeEmail(value) : value;

export class RegisterUserDto {
    @Transform(toNormalizedEmail)
    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(6)
    password!: string;

    @IsString()
    @MinLength(3)
    name!: string;
}

export class LoginDto {
    @Transform(toNormalizedEmail)
    @IsEmail()
    email!: string;

    @IsString()
    password!: string;
}

export class ResetPasswordDto {
    @IsString()
    @IsNotEmpty()
    token!: string;

    @IsString()
    @MinLength(6)
    newPassword!: string;
}

export class CreatePasswordResetLinkDto {
    @Transform(toNormalizedEmail)
    @IsEmail()
    email!: string;
}

