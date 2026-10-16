import { Body, Controller, Get, HttpCode, Patch, Post, UseGuards } from "@nestjs/common";
import { RegisterUserDto, LoginDto, ResetPasswordDto, ChangePasswordDto } from "../dtos/user.dto";
import { ChangePasswordUseCase } from "src/application/auth/change-password.use-case";
import { RegisterUserUseCase } from "src/application/auth/register-user.use-case";
import { LoginUserUseCase } from "src/application/auth/login-user.use-case";
import { GetMeUseCase } from "src/application/auth/get-me.use-case";
import { ResetPasswordUseCase } from "src/application/auth/reset-password.use-case";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { CurrentUser } from "../decorators/current-user.decorator";


@Controller('auth')
export class AuthController {
    constructor(
        private readonly registerUserUseCase: RegisterUserUseCase,
        private readonly loginUserUseCase: LoginUserUseCase,
        private readonly getMeUseCase: GetMeUseCase,
        private readonly resetPasswordUseCase: ResetPasswordUseCase,
        private readonly changePasswordUseCase: ChangePasswordUseCase,
    ) {}

    @Post('register')
    async register(@Body() dto: RegisterUserDto) {
        return this.registerUserUseCase.execute(dto)
    }

    @Post('login')
    async login(@Body() dto: LoginDto) {
        return this.loginUserUseCase.execute(dto)
    }

    // Datos del usuario logueado, incluido si es admin de la app
    @Get('me')
    @UseGuards(JwtAuthGuard)
    async me(@CurrentUser() user: { userId: string }) {
        return this.getMeUseCase.execute(user.userId)
    }

    @Patch('password')
    @UseGuards(JwtAuthGuard)
    @HttpCode(204)
    async changePassword(@Body() dto: ChangePasswordDto, @CurrentUser() user: { userId: string }) {
        await this.changePasswordUseCase.execute({ userId: user.userId, ...dto })
    }

    // Pública: con el link de un solo uso que generó un admin (POST /admin/password-reset-links)
    @Post('reset-password')
    @HttpCode(204)
    async resetPassword(@Body() dto: ResetPasswordDto) {
        await this.resetPasswordUseCase.execute(dto)
    }
}
