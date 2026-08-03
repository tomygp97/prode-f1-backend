import { Race } from '../entities/race.entity';
import { RaceStatus } from '../enums/race-status.enum';
import type { RaceMeetingData } from './official-results.provider';

export abstract class RaceRepository {
  abstract upsertFromMeeting(meeting: RaceMeetingData, seasonId: string, round: number): Promise<void>;
  abstract findById(id: string): Promise<Race | null>;
  abstract findAll(): Promise<any[]>;
  abstract findNext(): Promise<any | null>;
  abstract findScheduledBeforeDate(date: Date): Promise<any[]>;
  abstract findLockedRacesWithPastStartTime(date: Date): Promise<any[]>;
  abstract findRacesPendingResultsSync(): Promise<Race[]>;
  abstract updateStatus(raceId: string, status: RaceStatus): Promise<void>;
}