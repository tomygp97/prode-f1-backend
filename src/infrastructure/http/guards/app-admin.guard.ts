import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { UserRepository } from '../../../domain/ports/user.repository';

/**
 * Solo admins de la APP (users.app_role = ADMIN, los devs). Va después de JwtAuthGuard.
 * El rol se lee de la base en cada request: si se le saca a alguien, aplica en el momento.
 */
@Injectable()
export class AppAdminGuard implements CanActivate {
  constructor(private readonly userRepository: UserRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId: string | undefined = request.user?.userId;
    const user = userId ? await this.userRepository.findById(userId) : null;

    if (!user?.isAppAdmin()) {
      throw new ForbiddenException('Only app admins can do this');
    }
    return true;
  }
}
