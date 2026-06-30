import { User as PrismaUser } from '@prisma/client';
import { User } from '../../../domain/entities/user.entity';

export class UserMapper {
    static toDomain(prismaUser: PrismaUser): User {
        return User.create({
            id: prismaUser.id,
            email: prismaUser.email,
            password: prismaUser.password,
            name: prismaUser.name,
        });
    }

    static toPersistence(user: User) {
        return {
            id: user.id,
            email: user.email,
            password: user.password,
            name: user.name,
        };
    }
}