import { Body, Controller, Post } from "@nestjs/common";
import { RegisterUserDto } from "../dtos/user.dto";
import { RegisterUserUseCase } from "src/application/auth/register-user.use-case";


@Controller('auth')
export class AuthController {
    constructor(private readonly registerUserUseCase: RegisterUserUseCase) {}

    @Post('register')
    async register(@Body() dto: RegisterUserDto) {
        return this.registerUserUseCase.execute(dto)
    }
}