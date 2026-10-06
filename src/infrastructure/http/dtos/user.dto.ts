import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';
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

