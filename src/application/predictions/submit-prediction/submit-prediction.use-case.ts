import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prediction } from '../../../domain/entities/prediction.entity';
import { PredictionRepository } from '../../../domain/ports/prediction.repository';
import { LeagueRepository } from '../../../domain/ports/league.repository';
import { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';
import { RaceRepository } from '../../../domain/ports/race.repository';
import { RaceStatus } from '../../../domain/enums/race-status.enum';

@Injectable()
export class SubmitPredictionUseCase {
  constructor(
    private readonly predictionRepo: PredictionRepository,
    private readonly leagueRepo: LeagueRepository,
    private readonly memberRepo: LeagueMemberRepository,
    private readonly raceRepo: RaceRepository,
  ) {}

  async execute(input: {
    leagueId: string;
    raceId: string;
    userId: string;
    predictedOrder: string[];
    predictedPoleDriverId: string; 
    trackedDriverPosition?: number | null;
    safetyCar: boolean;
    dnfCount: number;
  }): Promise<Prediction> {
    const league = await this.leagueRepo.findById(input.leagueId);
    if (!league) {
      throw new NotFoundException('League not found');
    }

    const member = await this.memberRepo.findByLeagueAndUser(input.leagueId, input.userId);
    if (!member || !member.isActive()) {
      throw new ForbiddenException('You must be an active member of this league to submit a prediction');
    }

    const race = await this.raceRepo.findById(input.raceId);
    if (!race) {
      throw new NotFoundException('Race not found');
    }

    if (race.status !== RaceStatus.SCHEDULED) {
      throw new BadRequestException('Predictions are closed for this race');
    }

    if (input.predictedOrder.length !== league.predictionSlots) {
      throw new BadRequestException(
        `This league requires exactly ${league.predictionSlots} predicted positions`,
      );
    }

    const leagueTracksADriver = league.trackedDriverId !== null;
    if (leagueTracksADriver && (input.trackedDriverPosition === undefined || input.trackedDriverPosition === null)) {
      throw new BadRequestException('This league requires a tracked driver position prediction');
    }
    if (!leagueTracksADriver && input.trackedDriverPosition != null) {
      throw new BadRequestException('This league does not track a driver, tracked driver position must not be provided');
    }

    const existing = await this.predictionRepo.findByLeagueRaceAndUser(input.leagueId, input.raceId, input.userId);

    const prediction = Prediction.create({
      id: existing?.id ?? randomUUID(),
      userId: input.userId,
      leagueId: input.leagueId,
      raceId: input.raceId,
      predictedOrder: input.predictedOrder,
      predictedPoleDriverId: input.predictedPoleDriverId,
      trackedDriverPosition: input.trackedDriverPosition ?? null,
      safetyCar: input.safetyCar,
      dnfCount: input.dnfCount,
    });

    await this.predictionRepo.save(prediction);

    return prediction;
  }
}