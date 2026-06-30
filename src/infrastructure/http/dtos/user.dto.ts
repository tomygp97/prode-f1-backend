import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterUserDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    @MinLength(3)
    name: string;
}

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}