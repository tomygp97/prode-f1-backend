import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './controllers/auth.controller';
import { AdminController } from './controllers/admin.controller';
import { UserPrismaRepository } from '../database/repositories/user.prisma.repository';
import { PasswordResetTokenPrismaRepository } from '../database/repositories/password-reset-token.prisma.repository';
import { DatabaseModule } from '../database/database.module';
import { UserRepository } from '../../domain/ports/user.repository';
import { PasswordResetTokenRepository } from '../../domain/ports/password-reset-token.repository';
import { RegisterUserUseCase } from '../../application/auth/register-user.use-case';
import { LoginUserUseCase } from '../../application/auth/login-user.use-case';
import { GetMeUseCase } from '../../application/auth/get-me.use-case';
import { CreatePasswordResetLinkUseCase } from '../../application/auth/create-password-reset-link.use-case';
import { ResetPasswordUseCase } from '../../application/auth/reset-password.use-case';
import { ChangePasswordUseCase } from '../../application/auth/change-password.use-case';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AppAdminGuard } from './guards/app-admin.guard';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController, AdminController],
  providers: [
    RegisterUserUseCase,
    LoginUserUseCase,
    GetMeUseCase,
    CreatePasswordResetLinkUseCase,
    ResetPasswordUseCase,
    ChangePasswordUseCase,
    JwtAuthGuard,
    AppAdminGuard,
    {
      provide: UserRepository,
      useClass: UserPrismaRepository,
    },
    { provide: PasswordResetTokenRepository, useClass: PasswordResetTokenPrismaRepository },
  ],
})
export class AuthModule {}
