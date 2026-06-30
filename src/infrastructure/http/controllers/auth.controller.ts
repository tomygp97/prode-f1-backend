import { Body, Controller, Post } from "@nestjs/common";
import { RegisterUserUseCase } from "src/application/use-cases/register-user/register-user.use-case";
import { RegisterUserDto } from "../dtos/user.dto";


@Controller('auth')
export class AuthController {
    constructor(private readonly registerUserUseCase: RegisterUserUseCase) {}

    @Post('register')
    async register(@Body() dto: RegisterUserDto) {
        return this.registerUserUseCase.execute(dto)
    }
}