import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserMapper } from '../mappers/user.mapper';
import type { UserRepository } from '../../../domain/ports/user.repository';
import { User } from '../../../domain/entities/user.entity';

@Injectable()
export class UserPrismaRepository implements UserRepository {
    constructor(private readonly prisma: PrismaService) {}

    async save(user: User): Promise<void> {
        const data = UserMapper.toPersistence(user);
        await this.prisma.user.upsert({
            where: { id: user.id },
            update: data,
            create: data,
        });
    }

async findByEmail(email: string): Promise<User | null> {
    const found = await this.prisma.user.findUnique({ where: { email }});
    return found ? UserMapper.toDomain(found): null;
}

async findById(id: string): Promise<User | null> {
    const found = await this.prisma.user.findUnique({ where: { id } });
    return found ? UserMapper.toDomain(found) : null;
  }

}