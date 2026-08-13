import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';
import { LeagueDetail, LeagueRepository } from '../../../domain/ports/league.repository';
import { toLeagueView } from '../../../domain/views/league.view';

@Injectable()
export class GetLeagueByIdUseCase {
    constructor(
        private readonly leagueRepository: LeagueRepository,
        private readonly memberRepository: LeagueMemberRepository,
    ) {}

    async execute(input: { leagueId: string; requesterId: string }): Promise<LeagueDetail> {
        const league = await this.leagueRepository.findById(input.leagueId);
        if (!league) {
            throw new NotFoundException('League not found');
        }

        const member = await this.memberRepository.findByLeagueAndUser(input.leagueId, input.requesterId);
        const isActiveMember = member?.isActive() ?? false;

        if (!league.isPublic && !isActiveMember) {
            throw new ForbiddenException('You must be a member of this league to view it');
        }

        const members = await this.memberRepository.findActiveMembersByLeague(input.leagueId);

        return {
            league: toLeagueView(league),
            role: isActiveMember ? member!.role : null,
            membersCount: members.length,
            inviteCode: isActiveMember ? league.inviteCode : null,
        };
    }

}