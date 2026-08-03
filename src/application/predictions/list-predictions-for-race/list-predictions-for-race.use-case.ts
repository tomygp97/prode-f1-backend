import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prediction } from '../../../domain/entities/prediction.entity';
import { PredictionRepository } from '../../../domain/ports/prediction.repository';
import { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';
import { RaceRepository } from '../../../domain/ports/race.repository';
import { RaceStatus } from '../../../domain/enums/race-status.enum';

@Injectable()
export class ListPredictionsForRaceUseCase {
  constructor(
    private readonly predictionRepo: PredictionRepository,
    private readonly memberRepo: LeagueMemberRepository,
    private readonly raceRepo: RaceRepository,
  ) {}

  async execute(input: {
    leagueId: string;
    raceId: string;
    requesterId: string;
  }): Promise<Prediction[]> {
    const requester = await this.memberRepo.findByLeagueAndUser(input.leagueId, input.requesterId);
    if (!requester || !requester.isActive()) {
      throw new ForbiddenException('You must be an active member of this league to view predictions');
    }

    const race = await this.raceRepo.findById(input.raceId);
    if (!race) {
      throw new NotFoundException('Race not found');
    }

    if (race.status === RaceStatus.SCHEDULED) {
      throw new ForbiddenException('Predictions for this race are not visible yet');
    }

    return this.predictionRepo.findAllByLeagueAndRace(input.leagueId, input.raceId);
  }
}