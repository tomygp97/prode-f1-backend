import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UserRepository } from "../../domain/ports/user.repository";

export interface MeOutput {
    id: string;
    email: string;
    name: string;
    isAppAdmin: boolean;
}

@Injectable()
export class GetMeUseCase {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(userId: string): Promise<MeOutput> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        return { id: user.id, email: user.email, name: user.name, isAppAdmin: user.isAppAdmin() };
    }
}
