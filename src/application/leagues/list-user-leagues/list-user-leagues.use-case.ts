import { Injectable } from "@nestjs/common";
import { LeagueMemberRepository, UserLeagueMembership } from "../../../domain/ports/league-member.repository";

@Injectable()
export class ListUserLeaguesUseCase {
    constructor(private readonly leagueMemberRepository: LeagueMemberRepository) {}

    async execute(input: { userId: string }): Promise<UserLeagueMembership[]> {
        return await this.leagueMemberRepository.findActiveLeaguesByUser(input.userId);
    }
}