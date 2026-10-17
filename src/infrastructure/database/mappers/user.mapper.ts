import { AppRole as PrismaAppRole, User as PrismaUser } from '@prisma/client';
import { User } from '../../../domain/entities/user.entity';
import { AppRole } from '../../../domain/enums/app-role.enum';

export class UserMapper {
    static toDomain(prismaUser: PrismaUser): User {
        return User.create({
            id: prismaUser.id,
            email: prismaUser.email,
            password: prismaUser.password,
            name: prismaUser.name,
            appRole: prismaUser.appRole === PrismaAppRole.ADMIN ? AppRole.ADMIN : AppRole.USER,
        });
    }

    static toPersistence(user: User) {
        return {
            id: user.id,
            email: user.email,
            password: user.password,
            name: user.name,
            appRole: user.appRole === AppRole.ADMIN ? PrismaAppRole.ADMIN : PrismaAppRole.USER,
        };
    }
}
