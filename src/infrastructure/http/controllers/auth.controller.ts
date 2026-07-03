import { Body, Controller, Post } from "@nestjs/common";
import { RegisterUserDto, LoginDto } from "../dtos/user.dto";
import { RegisterUserUseCase } from "src/application/auth/register-user.use-case";
import { LoginUserUseCase } from "src/application/auth/login-user.use-case";


@Controller('auth')
export class AuthController {
    constructor(
        private readonly registerUserUseCase: RegisterUserUseCase,
        private readonly loginUserUseCase: LoginUserUseCase,
    ) {}

    @Post('register')
    async register(@Body() dto: RegisterUserDto) {
        return this.registerUserUseCase.execute(dto)
    }

    @Post('login')
    async login(@Body() dto: LoginDto) {
        return this.loginUserUseCase.execute(dto)
    }
}

