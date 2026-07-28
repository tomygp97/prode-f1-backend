import { RaceStatus } from '../enums/race-status.enum';
import type { RaceMeetingData } from './official-results.provider';
import { Race } from '../entities/race.entity';

export abstract class RaceRepository {
  abstract upsertFromMeeting(meeting: RaceMeetingData, seasonId: string, round: number): Promise<void>;
  abstract findAll(): Promise<any[]>;
  abstract findById(id: string): Promise<Race | null>;  // 👈 nuevo, necesario para predictions
  abstract findNext(): Promise<any | null>;
  abstract findScheduledBeforeDate(date: Date): Promise<any[]>;
  abstract findLockedRacesWithPastStartTime(date: Date): Promise<any[]>;
  abstract updateStatus(raceId: string, status: RaceStatus): Promise<void>;
}