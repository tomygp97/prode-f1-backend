import { Race } from '../entities/race.entity';
import { RaceStatus } from '../enums/race-status.enum';
import type { RaceMeetingData } from './official-results.provider';

export abstract class RaceRepository {
  abstract upsertFromMeeting(meeting: RaceMeetingData, seasonId: string, round: number): Promise<void>;
  abstract findById(id: string): Promise<Race | null>;
  abstract findByStatus(status: RaceStatus): Promise<Race[]>;
  abstract findAll(): Promise<Race[]>;
  abstract findRacesPendingScoreCalculation(): Promise<Race[]>;
  abstract markScoresCalculated(raceId: string): Promise<void>;
  abstract findNext(): Promise<Race | null>;
  abstract findLastResultsSynced(): Promise<Race | null>
  abstract findScheduledBeforeDate(date: Date): Promise<Race[]>;
  abstract findLockedRacesWithPastStartTime(date: Date): Promise<Race[]>;
  abstract findRacesPendingResultsSync(): Promise<Race[]>;
  /** RESULTS_SYNCED con largada desde `date`: candidatas a re-sync por penalizaciones. */
  abstract findResultsSyncedSince(date: Date): Promise<Race[]>;
  abstract updateStatus(raceId: string, status: RaceStatus): Promise<void>;
}