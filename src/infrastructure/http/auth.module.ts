import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { UserPrismaRepository } from '../database/repositories/user.prisma.repository';
import { DatabaseModule } from '../database/database.module';
import { UserRepository } from '../../domain/ports/user.repository';
import { RegisterUserUseCase } from 'src/application/auth/register-user.use-case';
import { LoginUserUseCase } from 'src/application/auth/login-user.use-case';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'mi-secreto',
      signOptions: { expiresIn: '1h' },
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