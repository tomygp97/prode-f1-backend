import { Injectable, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { UserRepository } from 'src/domain/ports/user.repository';
import { User } from 'src/domain/entities/user.entity';


export interface RegisterUserInput {
    email: string;
    password: string;
    name: string;
}

export interface RegisterUserOutput {
    id: string;
    email: string;
    name: string;
}

@Injectable()
export class RegisterUserUseCase {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
        const existing = await this.userRepository.findByEmail(input.email);
        if (existing) {
            throw new ConflictException('Email already registered');
        }

        const hashedPassword = await bcrypt.hash(input.password, 10);

        const user = User.create({
            id: randomUUID(),
            email: input.email,
            password: hashedPassword,
            name: input.name,
        })

        await this.userRepository.save(user);

        return {
            id: user.id,
            email: user.email,
            name: user.name,
        };
    }
}