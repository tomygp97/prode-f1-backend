import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UserRepository } from "../../domain/ports/user.repository";
import { User } from "../../domain/entities/user.entity"
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';


export interface LoginUserInput {
    email: string;
    password: string;
}

export interface LoginUserOutput {
    accessToken: string;
    user: {
        id: string;
        email: string;
        name: string;
    };
}

@Injectable()
export class LoginUserUseCase {
    constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

    async execute(input: LoginUserInput): Promise<LoginUserOutput> {
        const user = await this.userRepository.findByEmail(input.email);
        if (!user) {
            throw new UnauthorizedException('Invalid email');
        }

        const isPasswordValid = await bcrypt.compare(input.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid password');
        }

        const payload = { sub: user.id, email: user.email };
        const accessToken = this.jwtService.sign(payload);

        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        };
    }
}

