import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { League } from '../../../domain/entities/league.entity';
import { LeagueMember } from '../../../domain/entities/league-member.entity';
import { LeagueRepository } from '../../../domain/ports/league.repository';
import { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';
import { InviteCodeGenerator } from '../../../domain/ports/invite-code-generator';
import { DriverRepository } from '../../../domain/ports/driver.repository';

@Injectable()
export class CreateLeagueUseCase {
  constructor(
    private readonly leagueRepo: LeagueRepository,
    private readonly memberRepo: LeagueMemberRepository,
    private readonly codeGen: InviteCodeGenerator,
    private readonly driverRepo: DriverRepository,
  ) {}
  async execute(input: {
    name: string;
    ownerId: string;
    isPublic: boolean;
    predictionSlots?: number;
    seasonId: string;
    trackedDriverId?: string | null;
  }): Promise<League> {
    // El piloto seguido (uno por liga, cualquiera) tiene que ser del plantel de esa temporada
    if (input.trackedDriverId) {
      const driver = await this.driverRepo.findById(input.trackedDriverId);
      if (!driver || driver.seasonId !== input.seasonId) {
        throw new BadRequestException('The tracked driver is not part of this season');
      }
    }

    const league = League.create({
      id: randomUUID(),
      name: input.name,
      ownerId: input.ownerId,
      inviteCode: this.codeGen.generate(),
      isPublic: input.isPublic,
      predictionSlots: input.predictionSlots,
      seasonId: input.seasonId,
      trackedDriverId: input.trackedDriverId ?? null,
    });


    const ownerMember = LeagueMember.create({
      id: randomUUID(),
      leagueId: league.id,
      userId: input.ownerId,
      role: 'admin',
    });

    await this.leagueRepo.createWithOwner(league, ownerMember);

    return league;
  }
}