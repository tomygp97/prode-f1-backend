import { Race } from '../entities/race.entity';
import { RaceStatus } from '../enums/race-status.enum';
import type { RaceMeetingData } from './official-results.provider';

export abstract class RaceRepository {
  abstract upsertFromMeeting(meeting: RaceMeetingData, seasonId: string, round: number): Promise<void>;
  abstract findById(id: string): Promise<Race | null>;
  abstract findAll(): Promise<Race[]>;
  abstract findNext(): Promise<Race | null>;
  abstract findScheduledBeforeDate(date: Date): Promise<Race[]>;
  abstract findLockedRacesWithPastStartTime(date: Date): Promise<Race[]>;
  abstract findRacesPendingResultsSync(): Promise<Race[]>;
  abstract updateStatus(raceId: string, status: RaceStatus): Promise<void>;
}