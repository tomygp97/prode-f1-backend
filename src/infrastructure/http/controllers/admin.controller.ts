import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CreatePasswordResetLinkUseCase } from "src/application/auth/create-password-reset-link.use-case";
import { CreatePasswordResetLinkDto } from "../dtos/user.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { AppAdminGuard } from "../guards/app-admin.guard";
import { CurrentUser } from "../decorators/current-user.decorator";

// Herramientas para los admins de la app (users.app_role = ADMIN)
@Controller('admin')
@UseGuards(JwtAuthGuard, AppAdminGuard)
export class AdminController {
    constructor(private readonly createPasswordResetLink: CreatePasswordResetLinkUseCase) {}

    @Post('password-reset-links')
    async createResetLink(@Body() dto: CreatePasswordResetLinkDto, @CurrentUser() user: { userId: string }) {
        return this.createPasswordResetLink.execute({ adminUserId: user.userId, email: dto.email });
    }
}
