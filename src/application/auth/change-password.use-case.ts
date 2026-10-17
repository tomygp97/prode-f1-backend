import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { UserRepository } from "../../domain/ports/user.repository";
import { User } from "../../domain/entities/user.entity";
import { hashPassword, verifyPassword } from "./password-hasher";

/**
 * El usuario logueado cambia su contraseña (por ejemplo, después de entrar con un link de
 * restablecimiento). Una contraseña actual incorrecta es 400 y no 401: el front trata
 * cualquier 401 como sesión vencida y cerraría la sesión.
 */
@Injectable()
export class ChangePasswordUseCase {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(input: { userId: string; currentPassword: string; newPassword: string }): Promise<void> {
        const user = await this.userRepository.findById(input.userId);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        if (!(await verifyPassword(input.currentPassword, user.password))) {
            throw new BadRequestException('Current password is incorrect');
        }
        if (input.newPassword === input.currentPassword) {
            throw new BadRequestException('New password must be different');
        }

        await this.userRepository.save(User.create({
            id: user.id,
            email: user.email,
            name: user.name,
            appRole: user.appRole,
            password: await hashPassword(input.newPassword),
        }));
    }
}
