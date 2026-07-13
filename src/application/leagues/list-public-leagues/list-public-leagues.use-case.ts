import { Injectable, Inject } from '@nestjs/common';
import type { LeagueRepository, PublicLeagueWithMemberCount } from '../../../domain/ports/league.repository';

@Injectable()
export class ListPublicLeaguesUseCase {
  constructor(
    @Inject('LeagueRepository') private readonly leagueRepo: LeagueRepository,
  ) {}

  async execute(): Promise<PublicLeagueWithMemberCount[]> {
    return this.leagueRepo.findPublicLeaguesWithMemberCount();
  }
}