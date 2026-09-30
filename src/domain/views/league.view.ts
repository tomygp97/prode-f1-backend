import { League } from '../entities/league.entity';

export interface LeagueView {
  id: string;
  name: string;
  ownerId: string;
  isPublic: boolean;
  predictionSlots: number;
  seasonId: string;
  trackedDriverId: string | null;
}

export function toLeagueView(league: League): LeagueView {
  return {
    id: league.id,
    name: league.name,
    ownerId: league.ownerId,
    isPublic: league.isPublic,
    predictionSlots: league.predictionSlots,
    seasonId: league.seasonId,
    trackedDriverId: league.trackedDriverId,
  };
}
