import { Module } from "@nestjs/common";
import { AuthController } from './controllers/auth.controller';
import { RegisterUserUseCase } from '../../application/use-cases/register-user/register-user.use-case';
import { UserPrismaRepository } from '../database/repositories/user.prisma.repository';
import { PrismaService } from '../database/prisma/prisma.service';


@Module({
    controllers: [AuthController],
    providers: [
        PrismaService,
        RegisterUserUseCase,
        {
            provide: 'UserRepository',
            useClass: UserPrismaRepository,
        },
    ],
})
export class AuthModule {}