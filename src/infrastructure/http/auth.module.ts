import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './controllers/auth.controller';
import { UserPrismaRepository } from '../database/repositories/user.prisma.repository';
import { DatabaseModule } from '../database/database.module';
import { UserRepository } from '../../domain/ports/user.repository';
import { RegisterUserUseCase } from '../../application/auth/register-user.use-case';
import { LoginUserUseCase } from '../../application/auth/login-user.use-case';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    RegisterUserUseCase,
    LoginUserUseCase,
    {
      provide: UserRepository,
      useClass: UserPrismaRepository,
    },
  ],
})
export class AuthModule {}