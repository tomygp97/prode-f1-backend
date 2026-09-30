import { Injectable, Inject } from '@nestjs/common';
import { LeagueRepository, PublicLeagueWithMemberCount } from '../../../domain/ports/league.repository';

@Injectable()
export class ListPublicLeaguesUseCase {
  constructor(
    private readonly leagueRepo: LeagueRepository,
  ) {}

  async execute(): Promise<PublicLeagueWithMemberCount[]> {
    return this.leagueRepo.findPublicLeaguesWithMemberCount();
  }
}