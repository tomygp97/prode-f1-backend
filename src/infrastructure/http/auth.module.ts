import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { UserPrismaRepository } from '../database/repositories/user.prisma.repository';
import { DatabaseModule } from '../database/database.module';
import { UserRepository } from '../../domain/ports/user.repository';
import { RegisterUserUseCase } from 'src/application/auth/register-user.use-case';

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [
    RegisterUserUseCase,
    {
      provide: UserRepository,
      useClass: UserPrismaRepository,
    },
  ],
})
export class AuthModule {}