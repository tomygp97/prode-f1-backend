import { Injectable, Inject } from "@nestjs/common";
import { User } from '../../../domain/entities/user.entity';
import type { UserRepository } from '../../../domain/ports/user.repository';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';


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
    constructor(
        @Inject('UserRepository')
        private readonly userRepository: UserRepository,
    ){}

    async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
        const existing = await this.userRepository.findByEmail(input.email);
        if (existing) {
            throw new Error('Email already registered');
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