import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prediction } from '../../../domain/entities/prediction.entity';
import { PredictionScore } from '../../../domain/entities/prediction-score.entity';
import { PredictionRepository } from '../../../domain/ports/prediction.repository';
import { PredictionScoreRepository } from '../../../domain/ports/prediction-score.repository';
import { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';
import { RaceRepository } from '../../../domain/ports/race.repository';
import { UserRepository } from '../../../domain/ports/user.repository';

export interface LeaguePredictionEntry {
  userId: string;
  name: string;
  prediction: Prediction | null; // null = no cargó predicción
  score: PredictionScore | null; // null = sin predicción o puntos todavía sin calcular
}

export interface LeagueRacePredictionsView {
  raceId: string;
  entries: LeaguePredictionEntry[];
}

/**
 * Predicciones de todos los miembros activos de la liga para una carrera.
 * Solo visibles cuando ya se bloquearon (empezó la qualy): antes nadie puede ver las de otros.
 */
@Injectable()
export class ListPredictionsForRaceUseCase {
  constructor(
    private readonly predictionRepo: PredictionRepository,
    private readonly scoreRepo: PredictionScoreRepository,
    private readonly memberRepo: LeagueMemberRepository,
    private readonly raceRepo: RaceRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async execute(
    input: { leagueId: string; raceId: string; requesterId: string },
    now: Date = new Date(),
  ): Promise<LeagueRacePredictionsView> {
    const requester = await this.memberRepo.findByLeagueAndUser(input.leagueId, input.requesterId);
    if (!requester || !requester.isActive()) {
      throw new ForbiddenException('You must be an active member of this league to view predictions');
    }

    const race = await this.raceRepo.findById(input.raceId);
    if (!race) {
      throw new NotFoundException('Race not found');
    }

    if (race.arePredictionsOpen(now)) {
      throw new ForbiddenException('Predictions for this race are not visible yet');
    }

    const members = await this.memberRepo.findActiveMembersByLeague(input.leagueId);
    const [users, predictions] = await Promise.all([
      this.userRepo.findByIds(members.map((member) => member.userId)),
      this.predictionRepo.findAllByLeagueAndRace(input.leagueId, input.raceId),
    ]);
    const scores = await this.scoreRepo.findByPredictionIds(predictions.map((prediction) => prediction.id));

    const nameById = new Map(users.map((user) => [user.id, user.name]));
    const predictionByUserId = new Map(predictions.map((prediction) => [prediction.userId, prediction]));
    const scoreByPredictionId = new Map(scores.map((score) => [score.predictionId, score]));

    const entries = members.map((member): LeaguePredictionEntry => {
      const prediction = predictionByUserId.get(member.userId) ?? null;
      return {
        userId: member.userId,
        name: nameById.get(member.userId) ?? 'Usuario',
        prediction,
        score: prediction ? (scoreByPredictionId.get(prediction.id) ?? null) : null,
      };
    });

    return { raceId: race.id, entries: entries.sort(compareEntries) };
  }
}

// Más puntos primero; sin puntos, por nombre; los que no cargaron, al final
function compareEntries(a: LeaguePredictionEntry, b: LeaguePredictionEntry): number {
  const rank = (entry: LeaguePredictionEntry) => (entry.score ? 0 : entry.prediction ? 1 : 2);
  if (rank(a) !== rank(b)) return rank(a) - rank(b);
  if (a.score && b.score && a.score.totalPoints !== b.score.totalPoints) {
    return b.score.totalPoints - a.score.totalPoints;
  }
  return a.name.localeCompare(b.name, 'es');
}
