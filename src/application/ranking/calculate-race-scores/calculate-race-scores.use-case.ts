import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PredictionRepository } from '../../../domain/ports/prediction.repository';
import { PredictionScoreRepository } from '../../../domain/ports/prediction-score.repository';
import { LeagueRankingRepository } from '../../../domain/ports/league-ranking.repository';
import { LeagueRepository } from '../../../domain/ports/league.repository';
import { RaceResultRepository } from '../../../domain/ports/race-result.repository';
import { RaceDriverResultRepository } from '../../../domain/ports/race-driver-result.repository';
import { Prediction } from '../../../domain/entities/prediction.entity';
import { PredictionScore, PredictionScoreBreakdown } from '../../../domain/entities/prediction-score.entity';
import { LeagueRanking } from '../../../domain/entities/league-ranking.entity';
import { RaceResult } from '../../../domain/entities/race-result.entity';
import { RaceRepository } from '../../../domain/ports/race.repository';

const POINTS = {
  WINNER_EXACT: 25,
  POSITION_EXACT: 8,
  POSITION_OFF_BY_ONE: 3,
  SAFETY_CAR_EXACT: 5,
  DNF_EXACT: 10,
  DNF_OFF_BY_ONE: 5,
  TRACKED_DRIVER_EXACT: 10,
  TRACKED_DRIVER_OFF_BY_ONE: 5,
  POLE_EXACT: 20,
};

@Injectable()
export class CalculateRaceScoresUseCase {
  private readonly logger = new Logger(CalculateRaceScoresUseCase.name);

  constructor(
    private readonly predictionRepo: PredictionRepository,
    private readonly scoreRepo: PredictionScoreRepository,
    private readonly rankingRepo: LeagueRankingRepository,
    private readonly leagueRepo: LeagueRepository,
    private readonly raceRepo: RaceRepository,
    private readonly raceResultRepo: RaceResultRepository,
    private readonly driverResultRepo: RaceDriverResultRepository,
  ) {}

  async execute(raceId: string): Promise<void> {
    const raceResult = await this.raceResultRepo.findByRaceId(raceId);
    if (!raceResult) {
      throw new NotFoundException(`Race result not found for race ${raceId}`);
    }

    const driverResults = await this.driverResultRepo.findByRaceId(raceId);
    const positionByDriverId = new Map(
      driverResults.filter((d) => d.position !== null).map((d) => [d.driverId, d.position as number]),
    );

    const predictions = await this.predictionRepo.findAllByRaceId(raceId);

    for (const prediction of predictions) {
      const alreadyScored = await this.scoreRepo.findByPredictionId(prediction.id);
      if (alreadyScored) {
        continue;
      }

      const league = await this.leagueRepo.findById(prediction.leagueId);
      if (!league) {
        this.logger.warn(`League ${prediction.leagueId} not found, skipping prediction ${prediction.id}`);
        continue;
      }

      const trackedDriverActualPosition = league.trackedDriverId
        ? positionByDriverId.get(league.trackedDriverId)
        : undefined;

      const breakdown = this.calculateBreakdown(prediction, raceResult, positionByDriverId, trackedDriverActualPosition);

      const score = PredictionScore.create({
        id: randomUUID(),
        predictionId: prediction.id,
        pointsBreakdown: breakdown,
      });

      await this.scoreRepo.save(score);

      const currentRanking = await this.rankingRepo.findByLeagueAndUser(prediction.leagueId, prediction.userId);
      const updatedRanking = currentRanking
        ? currentRanking.addPoints(score.totalPoints)
        : LeagueRanking.create({ id: randomUUID(), leagueId: prediction.leagueId, userId: prediction.userId }).addPoints(score.totalPoints);

      await this.rankingRepo.save(updatedRanking);
    }

    this.logger.log(`Calculated scores for ${predictions.length} predictions in race ${raceId}`);

    await this.raceRepo.markScoresCalculated(raceId);
  }

  private calculateBreakdown(
    prediction: Prediction,
    raceResult: RaceResult,
    positionByDriverId: Map<string, number>,
    trackedDriverActualPosition: number | undefined,
  ): PredictionScoreBreakdown {
    let positions = 0;

    prediction.predictedOrder.forEach((driverId, index) => {
      const predictedPosition = index + 1;
      const actualPosition = positionByDriverId.get(driverId);

      if (actualPosition === undefined) return;

      const diff = Math.abs(actualPosition - predictedPosition);

      if (diff === 0) {
        positions += predictedPosition === 1 ? POINTS.WINNER_EXACT : POINTS.POSITION_EXACT;
      } else if (diff === 1) {
        positions += POINTS.POSITION_OFF_BY_ONE;
      }
    });

    const safetyCar = prediction.safetyCar === raceResult.safetyCar ? POINTS.SAFETY_CAR_EXACT : 0;

    let dnfCount = 0;
    const dnfDiff = Math.abs(prediction.dnfCount - raceResult.dnfCount);
    if (dnfDiff === 0) {
      dnfCount = POINTS.DNF_EXACT;
    } else if (dnfDiff === 1) {
      dnfCount = POINTS.DNF_OFF_BY_ONE;
    }

    const pole = prediction.predictedPoleDriverId === raceResult.poleDriverId ? POINTS.POLE_EXACT : 0; 

    let trackedDriver = 0;
    if (prediction.trackedDriverPosition != null && trackedDriverActualPosition !== undefined) {
      const diff = Math.abs(trackedDriverActualPosition - prediction.trackedDriverPosition);
      if (diff === 0) trackedDriver = POINTS.TRACKED_DRIVER_EXACT;
      else if (diff === 1) trackedDriver = POINTS.TRACKED_DRIVER_OFF_BY_ONE;
    }

    return { positions, safetyCar, dnfCount, pole, trackedDriver };
  }
}